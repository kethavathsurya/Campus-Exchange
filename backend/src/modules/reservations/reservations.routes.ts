import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../database/prisma';
import { authenticate } from '../../middleware/auth';
import { isValidStateTransition, LISTING_STATE_TRANSITIONS } from '../../utils/stateMachine';

const reserveRequestSchema = z.object({
  message: z.string().optional(),
});

export async function reservationRoutes(fastify: FastifyInstance) {
  // POST /api/listings/:id/reserve (Buyer requests reservation)
  fastify.post('/listings/:id/reserve', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const buyerId = request.user!.id;

    const listing = await prisma.listing.findUnique({ where: { id } });
    if (!listing || listing.status === 'REMOVED') {
      return reply.status(404).send({ error: 'Not Found', message: 'Listing not found' });
    }

    if (listing.sellerId === buyerId) {
      return reply.status(400).send({ error: 'Invalid Action', message: 'You cannot reserve your own listing' });
    }

    if (listing.status !== 'ACTIVE') {
      return reply.status(400).send({ error: 'Conflict', message: `Listing is currently ${listing.status} and cannot be reserved` });
    }

    // Check existing pending reservation by this user
    const existing = await prisma.reservation.findFirst({
      where: { listingId: id, buyerId, status: 'PENDING' },
    });

    if (existing) {
      return reply.status(400).send({ error: 'Conflict', message: 'You already have a pending reservation request for this item' });
    }

    const parseResult = reserveRequestSchema.safeParse(request.body || {});
    const customMessage = parseResult.success ? parseResult.data.message : undefined;

    const reservation = await prisma.reservation.create({
      data: {
        listingId: id,
        buyerId,
        message: customMessage || 'Interested in reserving this item.',
        status: 'PENDING',
      },
      include: {
        buyer: { select: { id: true, name: true, email: true } },
        listing: { select: { id: true, title: true, sellerId: true } },
      },
    });

    // Create notification for Seller
    await prisma.notification.create({
      data: {
        userId: listing.sellerId,
        title: 'New Reservation Request',
        message: `${request.user!.email} requested to reserve "${listing.title}"`,
        type: 'RESERVATION',
        linkUrl: `/listings/${id}`,
      },
    });

    return reply.status(201).send({ message: 'Reservation request submitted to seller', reservation });
  });

  // POST /api/listings/:id/reserve/accept (Seller accepts reservation)
  fastify.post('/listings/:id/reserve/accept', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { reservationId } = (request.body as { reservationId?: string }) || {};

    const listing = await prisma.listing.findUnique({ where: { id } });
    if (!listing) {
      return reply.status(404).send({ error: 'Not Found', message: 'Listing not found' });
    }

    if (listing.sellerId !== request.user!.id) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Only the seller can accept reservations' });
    }

    if (!isValidStateTransition(listing.status, 'RESERVED', LISTING_STATE_TRANSITIONS)) {
      return reply.status(400).send({ error: 'Invalid Transition', message: `Cannot reserve a listing in status ${listing.status}` });
    }

    // Find targeted reservation or latest pending
    const reservation = await prisma.reservation.findFirst({
      where: {
        listingId: id,
        status: 'PENDING',
        ...(reservationId ? { id: reservationId } : {}),
      },
      include: { buyer: true },
    });

    if (!reservation) {
      return reply.status(404).send({ error: 'Not Found', message: 'No pending reservation found to accept' });
    }

    // Transaction: Accept reservation, update listing status to RESERVED, reject other pending reservations
    await prisma.$transaction([
      prisma.reservation.update({
        where: { id: reservation.id },
        data: { status: 'ACCEPTED' },
      }),
      prisma.reservation.updateMany({
        where: { listingId: id, id: { not: reservation.id }, status: 'PENDING' },
        data: { status: 'REJECTED' },
      }),
      prisma.listing.update({
        where: { id },
        data: { status: 'RESERVED' },
      }),
    ]);

    // Notify accepted buyer
    await prisma.notification.create({
      data: {
        userId: reservation.buyerId,
        title: 'Reservation Accepted!',
        message: `Your reservation request for "${listing.title}" was accepted by the seller!`,
        type: 'RESERVATION',
        linkUrl: `/listings/${id}`,
      },
    });

    return reply.send({ message: 'Reservation accepted. Listing marked as RESERVED.' });
  });

  // POST /api/listings/:id/reserve/reject (Seller rejects reservation)
  fastify.post('/listings/:id/reserve/reject', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { reservationId } = (request.body as { reservationId?: string }) || {};

    const listing = await prisma.listing.findUnique({ where: { id } });
    if (!listing) {
      return reply.status(404).send({ error: 'Not Found', message: 'Listing not found' });
    }

    if (listing.sellerId !== request.user!.id) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Only seller can reject reservations' });
    }

    const reservation = await prisma.reservation.findFirst({
      where: {
        listingId: id,
        status: 'PENDING',
        ...(reservationId ? { id: reservationId } : {}),
      },
    });

    if (!reservation) {
      return reply.status(404).send({ error: 'Not Found', message: 'Pending reservation not found' });
    }

    await prisma.reservation.update({
      where: { id: reservation.id },
      data: { status: 'REJECTED' },
    });

    // Notify buyer
    await prisma.notification.create({
      data: {
        userId: reservation.buyerId,
        title: 'Reservation Request Update',
        message: `Your reservation request for "${listing.title}" was declined by seller.`,
        type: 'RESERVATION',
        linkUrl: `/listings/${id}`,
      },
    });

    return reply.send({ message: 'Reservation request declined.' });
  });

  // POST /api/listings/:id/close (Seller marks as SOLD / CLOSED)
  fastify.post('/listings/:id/close', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { finalStatus } = (request.body as { finalStatus?: string }) || {};

    const listing = await prisma.listing.findUnique({ where: { id } });
    if (!listing) {
      return reply.status(404).send({ error: 'Not Found', message: 'Listing not found' });
    }

    if (listing.sellerId !== request.user!.id && request.user!.role !== 'ADMIN') {
      return reply.status(403).send({ error: 'Forbidden', message: 'Unauthorized to change listing status' });
    }

    const targetStatus = finalStatus || 'SOLD';
    if (!isValidStateTransition(listing.status, targetStatus, LISTING_STATE_TRANSITIONS)) {
      return reply.status(400).send({ error: 'Invalid State Transition', message: `Cannot change status from ${listing.status} to ${targetStatus}` });
    }

    const updated = await prisma.listing.update({
      where: { id },
      data: { status: targetStatus },
    });

    return reply.send({ message: `Listing successfully updated to ${targetStatus}`, listing: updated });
  });
}
