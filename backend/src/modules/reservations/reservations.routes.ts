import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../database/prisma';
import { authenticate } from '../../middleware/auth';
import { isValidStateTransition, LISTING_STATE_TRANSITIONS } from '../../utils/stateMachine';

const reserveRequestSchema = z.object({
  message: z.string().max(500).optional(),
});

const acceptReservationSchema = z.object({
  reservationId: z.string().optional(),
});

const closeListingSchema = z.object({
  finalStatus: z.enum(['SOLD', 'EXCHANGED', 'GIVEN_AWAY', 'CLOSED']).optional(),
});

export async function reservationRoutes(fastify: FastifyInstance) {
  // POST /api/listings/:id/reserve (Buyer requests reservation)
  fastify.post('/listings/:id/reserve', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const buyerId = request.user!.id;

    const parseResult = reserveRequestSchema.safeParse(request.body || {});
    if (!parseResult.success) {
      return reply.status(400).send({ error: 'Validation Error', details: parseResult.error.errors });
    }

    const customMessage = parseResult.data.message;

    // Atomic transaction: verify status & create pending reservation
    const reservation = await prisma.$transaction(async (tx) => {
      const listing = await tx.listing.findUnique({ where: { id } });
      if (!listing || listing.status === 'REMOVED') {
        throw { statusCode: 404, message: 'Listing not found' };
      }

      if (listing.sellerId === buyerId) {
        throw { statusCode: 400, message: 'You cannot reserve your own listing' };
      }

      if (listing.status !== 'ACTIVE') {
        throw { statusCode: 409, message: `Listing is currently ${listing.status} and cannot receive new reservations` };
      }

      const existing = await tx.reservation.findFirst({
        where: { listingId: id, buyerId, status: 'PENDING' },
      });

      if (existing) {
        throw { statusCode: 409, message: 'You already have a pending reservation request for this item' };
      }

      return tx.reservation.create({
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
    }).catch(err => {
      if (err.statusCode) {
        reply.status(err.statusCode).send({ error: 'Reservation Error', message: err.message });
        return null;
      }
      throw err;
    });

    if (!reservation) return;

    // Create notification for Seller
    await prisma.notification.create({
      data: {
        userId: reservation.listing.sellerId,
        title: 'New Reservation Request',
        message: `${request.user!.email} requested to reserve "${reservation.listing.title}"`,
        type: 'RESERVATION',
        linkUrl: `/listings/${id}`,
      },
    });

    return reply.status(201).send({ message: 'Reservation request submitted to seller', reservation });
  });

  // POST /api/listings/:id/reserve/accept (Seller accepts reservation - CONCURRENCY GUARDED)
  fastify.post('/listings/:id/reserve/accept', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    
    const parseResult = acceptReservationSchema.safeParse(request.body || {});
    if (!parseResult.success) {
      return reply.status(400).send({ error: 'Validation Error', details: parseResult.error.errors });
    }

    const { reservationId } = parseResult.data;

    // Atomic transaction: verify status is ACTIVE, accept reservation, reject remaining pending, update status to RESERVED
    const result = await prisma.$transaction(async (tx) => {
      const listing = await tx.listing.findUnique({ where: { id } });
      if (!listing || listing.status === 'REMOVED') {
        throw { statusCode: 404, message: 'Listing not found' };
      }

      if (listing.sellerId !== request.user!.id) {
        throw { statusCode: 403, message: 'Only the seller can accept reservations' };
      }

      if (listing.status !== 'ACTIVE') {
        throw { statusCode: 409, message: `Cannot accept reservation. Listing status is already ${listing.status}` };
      }

      // Find targeted or latest pending reservation
      const targetReservation = await tx.reservation.findFirst({
        where: {
          listingId: id,
          status: 'PENDING',
          ...(reservationId ? { id: reservationId } : {}),
        },
      });

      if (!targetReservation) {
        throw { statusCode: 404, message: 'No pending reservation found to accept' };
      }

      // 1. Accept target reservation
      const acceptedReservation = await tx.reservation.update({
        where: { id: targetReservation.id },
        data: { status: 'ACCEPTED' },
      });

      // 2. Reject all other pending reservations for this listing
      await tx.reservation.updateMany({
        where: { listingId: id, id: { not: targetReservation.id }, status: 'PENDING' },
        data: { status: 'REJECTED' },
      });

      // 3. Mark listing status as RESERVED
      const updatedListing = await tx.listing.update({
        where: { id },
        data: { status: 'RESERVED' },
      });

      return { acceptedReservation, updatedListing };
    }).catch(err => {
      if (err.statusCode) {
        reply.status(err.statusCode).send({ error: 'Conflict Error', message: err.message });
        return null;
      }
      throw err;
    });

    if (!result) return;

    // Notify accepted buyer
    await prisma.notification.create({
      data: {
        userId: result.acceptedReservation.buyerId,
        title: 'Reservation Accepted!',
        message: `Your reservation request for listing was accepted by the seller!`,
        type: 'RESERVATION',
        linkUrl: `/listings/${id}`,
      },
    });

    return reply.send({ message: 'Reservation accepted. Listing marked as RESERVED.', reservation: result.acceptedReservation });
  });

  // POST /api/listings/:id/reserve/reject (Seller rejects reservation)
  fastify.post('/listings/:id/reserve/reject', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    
    const parseResult = acceptReservationSchema.safeParse(request.body || {});
    const { reservationId } = parseResult.success ? parseResult.data : {};

    const listing = await prisma.listing.findUnique({ where: { id } });
    if (!listing) {
      return reply.status(404).send({ error: 'Not Found', message: 'Listing not found' });
    }

    if (listing.sellerId !== request.user!.id) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Only seller can decline reservations' });
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
    
    const parseResult = closeListingSchema.safeParse(request.body || {});
    if (!parseResult.success) {
      return reply.status(400).send({ error: 'Validation Error', details: parseResult.error.errors });
    }

    const targetStatus = parseResult.data.finalStatus || 'SOLD';

    const listing = await prisma.listing.findUnique({ where: { id } });
    if (!listing) {
      return reply.status(404).send({ error: 'Not Found', message: 'Listing not found' });
    }

    if (listing.sellerId !== request.user!.id && request.user!.role !== 'ADMIN') {
      return reply.status(403).send({ error: 'Forbidden', message: 'Unauthorized to change listing status' });
    }

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
