import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../database/prisma';
import { authenticate, requireAdmin } from '../../middleware/auth';

const createContentReportSchema = z.object({
  contentType: z.enum(['LISTING', 'REPORT', 'USER']),
  targetId: z.string(),
  reason: z.enum(['SPAM', 'SUSPICIOUS', 'INAPPROPRIATE', 'MISLEADING', 'ABUSIVE']),
  details: z.string().optional(),
});

const adminReportActionSchema = z.object({
  status: z.enum(['REVIEWED', 'DISMISSED', 'ACTIONED']),
  notes: z.string().optional(),
});

export async function moderationRoutes(fastify: FastifyInstance) {
  // POST /api/moderation/reports (Students report content)
  fastify.post('/moderation/reports', { preHandler: [authenticate] }, async (request, reply) => {
    const parseResult = createContentReportSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ error: 'Validation Error', details: parseResult.error.errors });
    }

    const { contentType, targetId, reason, details } = parseResult.data;

    const report = await prisma.contentReport.create({
      data: {
        reporterId: request.user!.id,
        contentType,
        targetId,
        reason,
        details,
        status: 'PENDING',
      },
    });

    return reply.status(201).send({ message: 'Content report submitted for moderation review', report });
  });

  // GET /api/admin/reports (Admin only)
  fastify.get('/admin/reports', { preHandler: [requireAdmin] }, async (request, reply) => {
    const reports = await prisma.contentReport.findMany({
      include: {
        reporter: { select: { id: true, name: true, email: true } },
        actions: { include: { admin: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return reply.send({ reports });
  });

  // PATCH /api/admin/reports/:id (Admin review report)
  fastify.patch('/admin/reports/:id', { preHandler: [requireAdmin] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const adminId = request.user!.id;

    const report = await prisma.contentReport.findUnique({ where: { id } });
    if (!report) {
      return reply.status(404).send({ error: 'Not Found', message: 'Content report not found' });
    }

    const parseResult = adminReportActionSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ error: 'Validation Error', details: parseResult.error.errors });
    }

    const { status, notes } = parseResult.data;

    const [updatedReport] = await Promise.all([
      prisma.contentReport.update({
        where: { id },
        data: { status },
      }),
      prisma.moderationAction.create({
        data: {
          adminId,
          contentReportId: id,
          actionType: status === 'DISMISSED' ? 'DISMISS_REPORT' : 'WARN_USER',
          notes,
        },
      }),
    ]);

    return reply.send({ message: `Report status updated to ${status}`, report: updatedReport });
  });

  // PATCH /api/admin/listings/:id/remove (Admin remove listing)
  fastify.patch('/admin/listings/:id/remove', { preHandler: [requireAdmin] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const adminId = request.user!.id;
    const { notes } = (request.body as { notes?: string }) || {};

    const listing = await prisma.listing.findUnique({ where: { id } });
    if (!listing) {
      return reply.status(404).send({ error: 'Not Found', message: 'Listing not found' });
    }

    await prisma.$transaction([
      prisma.listing.update({
        where: { id },
        data: { status: 'REMOVED' },
      }),
      prisma.moderationAction.create({
        data: {
          adminId,
          actionType: 'REMOVE_CONTENT',
          notes: notes || `Admin removed listing "${listing.title}"`,
        },
      }),
    ]);

    return reply.send({ message: 'Listing removed by administrator' });
  });
}
