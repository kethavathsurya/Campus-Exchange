import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../database/prisma';
import { authenticate, requireVerified } from '../../middleware/auth';
import { isValidStateTransition, LISTING_STATE_TRANSITIONS } from '../../utils/stateMachine';

const listingQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
  categoryId: z.string().optional(),
  listingType: z.enum(['SELL', 'EXCHANGE', 'GIVE_AWAY', 'BUY_REQUEST']).optional(),
  condition: z.enum(['NEW', 'LIKE_NEW', 'GOOD', 'FAIR', 'USED']).optional(),
  minPrice: z.string().optional(),
  maxPrice: z.string().optional(),
  location: z.string().optional(),
  status: z.enum(['ACTIVE', 'RESERVED', 'SOLD', 'EXCHANGED', 'GIVEN_AWAY', 'CLOSED', 'REMOVED']).optional(),
  sort: z.enum(['newest', 'price_asc', 'price_desc', 'oldest']).optional(),
  sellerId: z.string().optional(),
});

const createListingSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  categoryId: z.string().min(1, 'Category is required'),
  listingType: z.enum(['SELL', 'EXCHANGE', 'GIVE_AWAY', 'BUY_REQUEST']),
  price: z.number().nullable().optional(),
  condition: z.enum(['NEW', 'LIKE_NEW', 'GOOD', 'FAIR', 'USED']),
  location: z.string().min(2, 'Location must be specified'),
  images: z.array(z.string()).min(1, 'At least one image URL is required'),
});

const updateListingSchema = z.object({
  title: z.string().min(3).max(100).optional(),
  description: z.string().min(10).optional(),
  categoryId: z.string().optional(),
  price: z.number().nullable().optional(),
  condition: z.enum(['NEW', 'LIKE_NEW', 'GOOD', 'FAIR', 'USED']).optional(),
  location: z.string().optional(),
  status: z.enum(['ACTIVE', 'RESERVED', 'SOLD', 'EXCHANGED', 'GIVEN_AWAY', 'CLOSED', 'REMOVED']).optional(),
  images: z.array(z.string()).optional(),
});

export async function listingRoutes(fastify: FastifyInstance) {
  // GET /api/listings
  fastify.get('/', async (request, reply) => {
    const parseQuery = listingQuerySchema.safeParse(request.query || {});
    if (!parseQuery.success) {
      return reply.status(400).send({ error: 'Validation Error', details: parseQuery.error.errors });
    }

    const {
      page: pageStr,
      limit: limitStr,
      search,
      categoryId,
      listingType,
      condition,
      minPrice,
      maxPrice,
      location,
      status,
      sort,
      sellerId,
    } = parseQuery.data;

    const page = parseInt(pageStr || '1', 10);
    const limit = Math.min(parseInt(limitStr || '12', 10), 50);
    const skip = (page - 1) * limit;

    const where: any = {
      status: status || { not: 'REMOVED' },
    };

    if (sellerId) where.sellerId = sellerId;
    if (categoryId) where.categoryId = categoryId;
    if (listingType) where.listingType = listingType;
    if (condition) where.condition = condition;
    if (location) where.location = { contains: location };

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ];
    }

    let orderBy: any = { createdAt: 'desc' };
    if (sort === 'price_asc') orderBy = { price: 'asc' };
    if (sort === 'price_desc') orderBy = { price: 'desc' };
    if (sort === 'oldest') orderBy = { createdAt: 'asc' };

    const [total, listings] = await Promise.all([
      prisma.listing.count({ where }),
      prisma.listing.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          seller: {
            select: { id: true, name: true, department: true, profileImage: true, isVerified: true },
          },
          category: true,
          images: true,
        },
      }),
    ]);

    return reply.send({
      listings,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  });

  // GET /api/listings/saved
  fastify.get('/saved', { preHandler: [authenticate] }, async (request, reply) => {
    const userId = request.user!.id;
    const wishlists = await prisma.wishlist.findMany({
      where: { userId },
      include: {
        listing: {
          include: {
            seller: {
              select: { id: true, name: true, isVerified: true },
            },
            category: true,
            images: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return reply.send({ savedListings: wishlists.map(w => w.listing) });
  });

  // GET /api/listings/:id
  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const listing = await prisma.listing.findUnique({
      where: { id },
      include: {
        seller: {
          select: { id: true, name: true, department: true, profileImage: true, isVerified: true, createdAt: true },
        },
        category: true,
        images: true,
        reservations: {
          include: { buyer: { select: { id: true, name: true } } },
        },
      },
    });

    if (!listing || listing.status === 'REMOVED') {
      return reply.status(404).send({ error: 'Not Found', message: 'Listing not found' });
    }

    let isSaved = false;
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const { verifyToken } = require('../../utils/jwt');
        const token = authHeader.substring(7);
        const payload = verifyToken(token);
        if (payload) {
          const savedCount = await prisma.wishlist.count({
            where: { userId: payload.userId, listingId: id },
          });
          isSaved = savedCount > 0;
        }
      } catch (err) {}
    }

    return reply.send({ listing, isSaved });
  });

  // POST /api/listings (Protected + Verified)
  fastify.post('/', { preHandler: [requireVerified] }, async (request, reply) => {
    const parseResult = createListingSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ error: 'Validation Error', details: parseResult.error.errors });
    }

    const { title, description, categoryId, listingType, price, condition, location, images } = parseResult.data;

    if (listingType === 'SELL' && (price === undefined || price === null || price < 0)) {
      return reply.status(400).send({ error: 'Validation Error', message: 'Price is required for SELL listings' });
    }

    const categoryExists = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!categoryExists) {
      return reply.status(400).send({ error: 'Invalid Category', message: 'Specified category does not exist' });
    }

    const newListing = await prisma.listing.create({
      data: {
        sellerId: request.user!.id,
        title,
        description,
        categoryId,
        listingType,
        price: listingType === 'SELL' ? price : null,
        condition,
        location,
        status: 'ACTIVE',
        images: {
          create: images.map((url, idx) => ({
            url,
            isPrimary: idx === 0,
          })),
        },
      },
      include: {
        seller: { select: { id: true, name: true, isVerified: true } },
        category: true,
        images: true,
      },
    });

    return reply.status(201).send({ message: 'Listing created successfully', listing: newListing });
  });

  // PATCH /api/listings/:id (Protected - Ownership or Admin)
  fastify.patch('/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const listing = await prisma.listing.findUnique({ where: { id } });

    if (!listing) {
      return reply.status(404).send({ error: 'Not Found', message: 'Listing not found' });
    }

    const isOwner = listing.sellerId === request.user!.id;
    const isAdmin = request.user!.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      return reply.status(403).send({ error: 'Forbidden', message: 'You can only edit your own listings' });
    }

    const parseResult = updateListingSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ error: 'Validation Error', details: parseResult.error.errors });
    }

    const updates = parseResult.data;

    if (updates.status && updates.status !== listing.status) {
      if (!isValidStateTransition(listing.status, updates.status, LISTING_STATE_TRANSITIONS)) {
        return reply.status(400).send({
          error: 'Invalid Transition',
          message: `Cannot transition listing status from ${listing.status} to ${updates.status}`,
        });
      }
    }

    const updatedListing = await prisma.listing.update({
      where: { id },
      data: {
        ...(updates.title && { title: updates.title }),
        ...(updates.description && { description: updates.description }),
        ...(updates.categoryId && { categoryId: updates.categoryId }),
        ...(updates.price !== undefined && { price: updates.price }),
        ...(updates.condition && { condition: updates.condition }),
        ...(updates.location && { location: updates.location }),
        ...(updates.status && { status: updates.status }),
      },
      include: {
        category: true,
        images: true,
      },
    });

    return reply.send({ message: 'Listing updated', listing: updatedListing });
  });

  // DELETE /api/listings/:id (Protected - Ownership or Admin)
  fastify.delete('/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const listing = await prisma.listing.findUnique({ where: { id } });

    if (!listing) {
      return reply.status(404).send({ error: 'Not Found', message: 'Listing not found' });
    }

    const isOwner = listing.sellerId === request.user!.id;
    const isAdmin = request.user!.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Unauthorized to delete this listing' });
    }

    await prisma.listing.update({
      where: { id },
      data: { status: 'REMOVED' },
    });

    return reply.send({ message: 'Listing removed successfully' });
  });

  // POST /api/listings/:id/save
  fastify.post('/:id/save', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const userId = request.user!.id;

    const listing = await prisma.listing.findUnique({ where: { id } });
    if (!listing || listing.status === 'REMOVED') {
      return reply.status(404).send({ error: 'Not Found', message: 'Listing not found' });
    }

    const existing = await prisma.wishlist.findUnique({
      where: { userId_listingId: { userId, listingId: id } },
    });

    if (existing) {
      return reply.send({ message: 'Listing is already in your saved items' });
    }

    await prisma.wishlist.create({
      data: { userId, listingId: id },
    });

    return reply.send({ message: 'Listing saved to wishlist' });
  });

  // DELETE /api/listings/:id/save
  fastify.delete('/:id/save', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const userId = request.user!.id;

    await prisma.wishlist.deleteMany({
      where: { userId, listingId: id },
    });

    return reply.send({ message: 'Listing removed from saved items' });
  });
}
