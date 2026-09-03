import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../database/prisma';
import { authenticate } from '../../middleware/auth';
import { isValidStateTransition, CLAIM_STATE_TRANSITIONS } from '../../utils/stateMachine';

const createClaimSchema = z.object({
  explanation: z.string().min(10),
  verificationQuestion: z.string().optional(),
  verificationAnswer: z.string().optional(),
});

const updateClaimSchema = z.object({
  status: z.enum(['ACCEPTED', 'REJECTED', 'WITHDRAWN']),
});

export async function claimRoutes(fastify: FastifyInstance) {
  // POST /api/reports/:id/claims (Submit a claim)
  fastify.post('/reports/:id/claims', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const claimantId = request.user!.id;

    const report = await prisma.lostFoundReport.findUnique({ where: { id } });
    if (!report) {
      return reply.status(404).send({ error: 'Not Found', message: 'Report not found' });
    }

    if (report.reporterId === claimantId) {
      return reply.status(400).send({ error: 'Invalid Action', message: 'You cannot claim your own report' });
    }

    if (report.status === 'RESOLVED' || report.status === 'CLOSED') {
      return reply.status(400).send({ error: 'Case Closed', message: 'This report has already been resolved or closed' });
    }

    const parseResult = createClaimSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ error: 'Validation Error', details: parseResult.error.errors });
    }

    // Check existing pending claim by user
    const existing = await prisma.claim.findFirst({
      where: { reportId: id, claimantId, status: 'PENDING' },
    });

    if (existing) {
      return reply.status(400).send({ error: 'Conflict', message: 'You already have a pending claim for this report' });
    }

    const { explanation, verificationQuestion, verificationAnswer } = parseResult.data;

    const claim = await prisma.claim.create({
      data: {
        reportId: id,
        claimantId,
        explanation,
        verificationQuestion,
        verificationAnswer,
        status: 'PENDING',
      },
      include: {
        claimant: { select: { id: true, name: true, isVerified: true } },
      },
    });

    // Notify report owner
    await prisma.notification.create({
      data: {
        userId: report.reporterId,
        title: 'New Ownership Claim',
        message: `${request.user!.name} submitted an ownership claim on "${report.title}"`,
        type: 'CLAIM',
        linkUrl: `/reports/${id}`,
      },
    });

    return reply.status(201).send({ message: 'Claim submitted successfully', claim });
  });

  // GET /api/reports/:id/claims (Report owner or Admin can view all claims with verification details)
  fastify.get('/reports/:id/claims', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const report = await prisma.lostFoundReport.findUnique({ where: { id } });

    if (!report) {
      return reply.status(404).send({ error: 'Not Found', message: 'Report not found' });
    }

    const isOwner = report.reporterId === request.user!.id;
    const isAdmin = request.user!.role === 'ADMIN';

    // Non-owners can only see their own claim
    const claims = await prisma.claim.findMany({
      where: {
        reportId: id,
        ...(!isOwner && !isAdmin ? { claimantId: request.user!.id } : {}),
      },
      include: {
        claimant: { select: { id: true, name: true, department: true, profileImage: true, isVerified: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return reply.send({ claims });
  });

  // PATCH /api/claims/:id (Report owner updates claim state - accept/reject)
  fastify.patch('/claims/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const claim = await prisma.claim.findUnique({
      where: { id },
      include: { report: true },
    });

    if (!claim) {
      return reply.status(404).send({ error: 'Not Found', message: 'Claim not found' });
    }

    const isReportOwner = claim.report.reporterId === request.user!.id;
    const isClaimant = claim.claimantId === request.user!.id;
    const isAdmin = request.user!.role === 'ADMIN';

    const parseResult = updateClaimSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ error: 'Validation Error', details: parseResult.error.errors });
    }

    const newStatus = parseResult.data.status;

    if (newStatus === 'WITHDRAWN') {
      if (!isClaimant && !isAdmin) {
        return reply.status(403).send({ error: 'Forbidden', message: 'Only claimant can withdraw a claim' });
      }
    } else {
      if (!isReportOwner && !isAdmin) {
        return reply.status(403).send({ error: 'Forbidden', message: 'Only report owner can accept or reject claims' });
      }
    }

    if (!isValidStateTransition(claim.status, newStatus, CLAIM_STATE_TRANSITIONS)) {
      return reply.status(400).send({
        error: 'Invalid Transition',
        message: `Cannot change claim status from ${claim.status} to ${newStatus}`,
      });
    }

    if (newStatus === 'ACCEPTED') {
      // Ensure single-winner: accept this claim, reject all other claims, resolve the report
      await prisma.$transaction([
        prisma.claim.update({
          where: { id },
          data: { status: 'ACCEPTED' },
        }),
        prisma.claim.updateMany({
          where: { reportId: claim.reportId, id: { not: id }, status: 'PENDING' },
          data: { status: 'REJECTED' },
        }),
        prisma.lostFoundReport.update({
          where: { id: claim.reportId },
          data: { status: 'RESOLVED' },
        }),
      ]);

      // Notify accepted claimant
      await prisma.notification.create({
        data: {
          userId: claim.claimantId,
          title: 'Claim Accepted!',
          message: `Your ownership claim for "${claim.report.title}" was accepted! Case marked as RESOLVED.`,
          type: 'CLAIM',
          linkUrl: `/reports/${claim.reportId}`,
        },
      });

      return reply.send({ message: 'Claim accepted. Case resolved successfully.' });
    }

    const updatedClaim = await prisma.claim.update({
      where: { id },
      data: { status: newStatus },
    });

    if (newStatus === 'REJECTED') {
      await prisma.notification.create({
        data: {
          userId: claim.claimantId,
          title: 'Claim Update',
          message: `Your ownership claim for "${claim.report.title}" was declined by the report owner.`,
          type: 'CLAIM',
          linkUrl: `/reports/${claim.reportId}`,
        },
      });
    }

    return reply.send({ message: `Claim status updated to ${newStatus}`, claim: updatedClaim });
  });
}
