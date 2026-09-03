import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../database/prisma';
import { authenticate } from '../../middleware/auth';

const createConversationSchema = z.object({
  recipientId: z.string().uuid().or(z.string().min(1)),
  listingId: z.string().optional(),
});

const sendMessageSchema = z.object({
  content: z.string().min(1).max(1000),
});

export async function messagingRoutes(fastify: FastifyInstance) {
  // GET /api/conversations (List user's active conversations - EFFICIENT BATCHED QUERY)
  fastify.get('/conversations', { preHandler: [authenticate] }, async (request, reply) => {
    const userId = request.user!.id;

    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [{ participant1Id: userId }, { participant2Id: userId }],
      },
      include: {
        participant1: { select: { id: true, name: true, profileImage: true, isVerified: true } },
        participant2: { select: { id: true, name: true, profileImage: true, isVerified: true } },
        listing: { select: { id: true, title: true, price: true, status: true, images: { take: 1 } } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    if (conversations.length === 0) {
      return reply.send({ conversations: [] });
    }

    const conversationIds = conversations.map(c => c.id);

    // Batch fetch unread counts in single query (Eliminating N+1 queries)
    const unreadGroups = await prisma.message.groupBy({
      by: ['conversationId'],
      where: {
        conversationId: { in: conversationIds },
        senderId: { not: userId },
        isRead: false,
      },
      _count: { id: true },
    });

    const unreadMap = new Map<string, number>();
    for (const group of unreadGroups) {
      unreadMap.set(group.conversationId, group._count.id);
    }

    const formatted = conversations.map(conv => {
      const partner = conv.participant1Id === userId ? conv.participant2 : conv.participant1;
      return {
        id: conv.id,
        listing: conv.listing,
        partner,
        lastMessage: conv.messages[0] || null,
        unreadCount: unreadMap.get(conv.id) || 0,
        updatedAt: conv.updatedAt,
      };
    });

    return reply.send({ conversations: formatted });
  });

  // POST /api/conversations (Start or retrieve conversation)
  fastify.post('/conversations', { preHandler: [authenticate] }, async (request, reply) => {
    const parseResult = createConversationSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ error: 'Validation Error', details: parseResult.error.errors });
    }

    const userId = request.user!.id;
    const { recipientId, listingId } = parseResult.data;

    if (recipientId === userId) {
      return reply.status(400).send({ error: 'Invalid Action', message: 'You cannot message yourself' });
    }

    const recipientExists = await prisma.user.findUnique({ where: { id: recipientId } });
    if (!recipientExists) {
      return reply.status(404).send({ error: 'Not Found', message: 'Recipient user does not exist' });
    }

    // Sort participant IDs deterministically
    const [p1, p2] = [userId, recipientId].sort();

    let conversation = await prisma.conversation.findFirst({
      where: {
        participant1Id: p1,
        participant2Id: p2,
        listingId: listingId || null,
      },
      include: {
        participant1: { select: { id: true, name: true, profileImage: true, isVerified: true } },
        participant2: { select: { id: true, name: true, profileImage: true, isVerified: true } },
        listing: { select: { id: true, title: true, price: true } },
      },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          participant1Id: p1,
          participant2Id: p2,
          listingId: listingId || null,
        },
        include: {
          participant1: { select: { id: true, name: true, profileImage: true, isVerified: true } },
          participant2: { select: { id: true, name: true, profileImage: true, isVerified: true } },
          listing: { select: { id: true, title: true, price: true } },
        },
      });
    }

    const partner = conversation.participant1Id === userId ? conversation.participant2 : conversation.participant1;

    return reply.status(201).send({
      conversation: {
        id: conversation.id,
        listing: conversation.listing,
        partner,
        updatedAt: conversation.updatedAt,
      },
    });
  });

  // GET /api/conversations/:id/messages (Fetch history & mark read)
  fastify.get('/conversations/:id/messages', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const userId = request.user!.id;

    const conversation = await prisma.conversation.findUnique({ where: { id } });
    if (!conversation) {
      return reply.status(404).send({ error: 'Not Found', message: 'Conversation not found' });
    }

    if (conversation.participant1Id !== userId && conversation.participant2Id !== userId) {
      return reply.status(403).send({ error: 'Forbidden', message: 'You are not a participant in this conversation' });
    }

    await prisma.message.updateMany({
      where: { conversationId: id, senderId: { not: userId }, isRead: false },
      data: { isRead: true },
    });

    const messages = await prisma.message.findMany({
      where: { conversationId: id },
      orderBy: { createdAt: 'asc' },
      include: { sender: { select: { id: true, name: true, profileImage: true } } },
    });

    return reply.send({ messages });
  });

  // POST /api/conversations/:id/messages (Send message)
  fastify.post('/conversations/:id/messages', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const userId = request.user!.id;

    const conversation = await prisma.conversation.findUnique({ where: { id } });
    if (!conversation) {
      return reply.status(404).send({ error: 'Not Found', message: 'Conversation not found' });
    }

    if (conversation.participant1Id !== userId && conversation.participant2Id !== userId) {
      return reply.status(403).send({ error: 'Forbidden', message: 'You are not a participant in this conversation' });
    }

    const parseResult = sendMessageSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ error: 'Validation Error', details: parseResult.error.errors });
    }

    const { content } = parseResult.data;

    const [message] = await Promise.all([
      prisma.message.create({
        data: {
          conversationId: id,
          senderId: userId,
          content,
          isRead: false,
        },
        include: { sender: { select: { id: true, name: true, profileImage: true } } },
      }),
      prisma.conversation.update({
        where: { id },
        data: { updatedAt: new Date() },
      }),
    ]);

    const recipientId = conversation.participant1Id === userId ? conversation.participant2Id : conversation.participant1Id;

    await prisma.notification.create({
      data: {
        userId: recipientId,
        title: 'New Message',
        message: `${request.user!.email}: ${content.substring(0, 60)}${content.length > 60 ? '...' : ''}`,
        type: 'MESSAGE',
        linkUrl: `/messages?conversationId=${id}`,
      },
    });

    if ((fastify as any).io) {
      (fastify as any).io.to(`user:${recipientId}`).emit('message:received', message);
    }

    return reply.status(201).send({ message });
  });
}
