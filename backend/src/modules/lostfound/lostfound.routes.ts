import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../database/prisma';
import { authenticate, requireVerified } from '../../middleware/auth';
import { calculateMatchScore } from '../../services/matchingService';
import { isValidStateTransition, REPORT_STATE_TRANSITIONS } from '../../utils/stateMachine';

const createReportSchema = z.object({
  reportType: z.enum(['LOST', 'FOUND']),
  title: z.string().min(3).max(100),
  description: z.string().min(10),
  categoryId: z.string(),
  location: z.string().min(2),
  dateEvent: z.string(), // ISO date string
  approximateTime: z.string().optional(),
  distinguishingAttributes: z.string().optional(),
  visibleAttributes: z.string().optional(),
  images: z.array(z.string()).optional(),
});

export async function lostFoundRoutes(fastify: FastifyInstance) {
  // GET /api/reports
  fastify.get('/', async (request, reply) => {
    const query = request.query as any;
    const page = parseInt(query.page || '1', 10);
    const limit = Math.min(parseInt(query.limit || '12', 10), 50);
    const skip = (page - 1) * limit;

    const { reportType, categoryId, location, search, status, reporterId } = query;

    const where: any = {};
    if (reportType) where.reportType = reportType;
    if (categoryId) where.categoryId = categoryId;
    if (status) {
      where.status = status;
    } else {
      where.status = { not: 'CLOSED' };
    }
    if (reporterId) where.reporterId = reporterId;
    if (location) where.location = { contains: location };

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { distinguishingAttributes: { contains: search } },
        { visibleAttributes: { contains: search } },
      ];
    }

    const [total, reports] = await Promise.all([
      prisma.lostFoundReport.count({ where }),
      prisma.lostFoundReport.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          reporter: {
            select: { id: true, name: true, department: true, profileImage: true, isVerified: true },
          },
          category: true,
          images: true,
          _count: { select: { claims: true } },
        },
      }),
    ]);

    return reply.send({
      reports,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  });

  // GET /api/reports/:id
  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const report = await prisma.lostFoundReport.findUnique({
      where: { id },
      include: {
        reporter: {
          select: { id: true, name: true, department: true, profileImage: true, isVerified: true },
        },
        category: true,
        images: true,
        claims: {
          select: {
            id: true,
            claimantId: true,
            status: true,
            createdAt: true,
            explanation: true,
            claimant: { select: { id: true, name: true, isVerified: true } },
          },
        },
      },
    });

    if (!report) {
      return reply.status(404).send({ error: 'Not Found', message: 'Report not found' });
    }

    return reply.send({ report });
  });

  // POST /api/reports
  fastify.post('/', { preHandler: [requireVerified] }, async (request, reply) => {
    const parseResult = createReportSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ error: 'Validation Error', details: parseResult.error.errors });
    }

    const {
      reportType,
      title,
      description,
      categoryId,
      location,
      dateEvent,
      approximateTime,
      distinguishingAttributes,
      visibleAttributes,
      images,
    } = parseResult.data;

    const categoryExists = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!categoryExists) {
      return reply.status(400).send({ error: 'Invalid Category', message: 'Category does not exist' });
    }

    const initialStatus = reportType === 'LOST' ? 'LOST' : 'FOUND';

    const report = await prisma.lostFoundReport.create({
      data: {
        reporterId: request.user!.id,
        reportType,
        title,
        description,
        categoryId,
        location,
        dateEvent: new Date(dateEvent),
        approximateTime,
        distinguishingAttributes,
        visibleAttributes,
        status: initialStatus,
        images: images && images.length > 0 ? {
          create: images.map(url => ({ url })),
        } : undefined,
      },
      include: {
        reporter: { select: { id: true, name: true, isVerified: true } },
        category: true,
        images: true,
      },
    });

    return reply.status(201).send({ message: 'Report created successfully', report });
  });

  // PATCH /api/reports/:id
  fastify.patch('/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const report = await prisma.lostFoundReport.findUnique({ where: { id } });

    if (!report) {
      return reply.status(404).send({ error: 'Not Found', message: 'Report not found' });
    }

    const isOwner = report.reporterId === request.user!.id;
    const isAdmin = request.user!.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Unauthorized to edit this report' });
    }

    const { status, title, description, location } = (request.body as any) || {};

    if (status && status !== report.status) {
      if (!isValidStateTransition(report.status, status, REPORT_STATE_TRANSITIONS)) {
        return reply.status(400).send({
          error: 'Invalid Transition',
          message: `Cannot transition report status from ${report.status} to ${status}`,
        });
      }
    }

    const updated = await prisma.lostFoundReport.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(location && { location }),
        ...(status && { status }),
      },
      include: { category: true, images: true },
    });

    return reply.send({ message: 'Report updated', report: updated });
  });

  // GET /api/reports/:id/matches (Scored matching engine)
  fastify.get('/:id/matches', async (request, reply) => {
    const { id } = request.params as { id: string };
    const sourceReport = await prisma.lostFoundReport.findUnique({
      where: { id },
      include: { category: true },
    });

    if (!sourceReport) {
      return reply.status(404).send({ error: 'Not Found', message: 'Report not found' });
    }

    // Target reports are opposite reportType (e.g. LOST matches with FOUND, and vice versa)
    const targetType = sourceReport.reportType === 'LOST' ? 'FOUND' : 'LOST';

    const potentialCandidates = await prisma.lostFoundReport.findMany({
      where: {
        reportType: targetType,
        status: { in: ['LOST', 'FOUND'] },
        id: { not: id },
      },
      include: {
        category: true,
        reporter: { select: { id: true, name: true, isVerified: true } },
        images: true,
      },
    });

    const matchResults = potentialCandidates
      .map(candidate => calculateMatchScore(sourceReport, candidate))
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score);

    return reply.send({
      sourceReportId: id,
      targetType,
      matches: matchResults,
    });
  });
}
