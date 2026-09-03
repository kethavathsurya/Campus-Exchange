import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyMultipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import path from 'path';

import { authRoutes } from './modules/auth/auth.routes';
import { listingRoutes } from './modules/listings/listings.routes';
import { reservationRoutes } from './modules/reservations/reservations.routes';
import { lostFoundRoutes } from './modules/lostfound/lostfound.routes';
import { claimRoutes } from './modules/claims/claims.routes';
import { messagingRoutes } from './modules/messaging/messaging.routes';
import { notificationRoutes } from './modules/notifications/notifications.routes';
import { moderationRoutes } from './modules/moderation/moderation.routes';
import { saveUploadedFile, ALLOWED_MIME_TYPES, MAX_FILE_SIZE_BYTES } from './services/storageService';
import { authenticate } from './middleware/auth';

export function buildApp() {
  const fastify = Fastify({
    logger: false,
  });

  // Plugins
  fastify.register(cors, {
    origin: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  fastify.register(fastifyMultipart, {
    limits: {
      fileSize: MAX_FILE_SIZE_BYTES,
    },
  });

  // Serve static uploads
  fastify.register(fastifyStatic, {
    root: path.join(__dirname, '../uploads'),
    prefix: '/uploads/',
  });

  // Health check
  fastify.get('/health', async () => {
    return { status: 'ok', service: 'Campus Exchange API', timestamp: new Date().toISOString() };
  });

  // Categories list
  fastify.get('/api/categories', async () => {
    const { prisma } = require('./database/prisma');
    const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });
    return { categories };
  });

  // Image Upload endpoint
  fastify.post('/api/upload', { preHandler: [authenticate] }, async (request, reply) => {
    const data = await request.file();
    if (!data) {
      return reply.status(400).send({ error: 'Bad Request', message: 'No file uploaded' });
    }

    if (!ALLOWED_MIME_TYPES.includes(data.mimetype)) {
      return reply.status(400).send({ error: 'Unsupported File Type', message: 'Only JPEG, PNG and WebP images are allowed' });
    }

    const buffer = await data.toBuffer();
    const url = await saveUploadedFile(data.filename, buffer);

    return reply.status(201).send({ url });
  });

  // Register Modules
  fastify.register(authRoutes, { prefix: '/api/auth' });
  fastify.register(listingRoutes, { prefix: '/api/listings' });
  fastify.register(reservationRoutes, { prefix: '/api' });
  fastify.register(lostFoundRoutes, { prefix: '/api/reports' });
  fastify.register(claimRoutes, { prefix: '/api' });
  fastify.register(messagingRoutes, { prefix: '/api' });
  fastify.register(notificationRoutes, { prefix: '/api/notifications' });
  fastify.register(moderationRoutes, { prefix: '/api' });

  // Global Error Handler
  fastify.setErrorHandler((error, _request, reply) => {
    const statusCode = error.statusCode || 500;
    return reply.status(statusCode).send({
      error: error.name || 'InternalServerError',
      message: error.message || 'An unexpected error occurred on the server',
    });
  });

  return fastify;
}
