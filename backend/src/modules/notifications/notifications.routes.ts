import { FastifyInstance } from 'fastify';
import { prisma } from '../../database/prisma';
import { authenticate } from '../../middleware/auth';

export async function notificationRoutes(fastify: FastifyInstance) {
  // GET /api/notifications
  fastify.get('/', { preHandler: [authenticate] }, async (request, reply) => {
    const userId = request.user!.id;

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 30,
      }),
      prisma.notification.count({
        where: { userId, isRead: false },
      }),
    ]);

    return reply.send({ notifications, unreadCount });
  });

  // PATCH /api/notifications/:id/read
  fastify.patch('/:id/read', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const userId = request.user!.id;

    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification || notification.userId !== userId) {
      return reply.status(404).send({ error: 'Not Found', message: 'Notification not found' });
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    return reply.send({ notification: updated });
  });

  // POST /api/notifications/read-all
  fastify.post('/read-all', { preHandler: [authenticate] }, async (request, reply) => {
    const userId = request.user!.id;

    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    return reply.send({ message: 'All notifications marked as read' });
  });
}
