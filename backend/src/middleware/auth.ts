import { FastifyRequest, FastifyReply } from 'fastify';
import { verifyToken, JwtPayload } from '../utils/jwt';
import { prisma } from '../database/prisma';

declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      id: string;
      email: string;
      role: string;
      isVerified: boolean;
    };
  }
}

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return reply.status(401).send({ error: 'Unauthorized', message: 'Missing or invalid token format' });
  }

  const token = authHeader.substring(7);
  const payload = verifyToken(token);
  if (!payload) {
    return reply.status(401).send({ error: 'Unauthorized', message: 'Token invalid or expired' });
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, email: true, role: true, isVerified: true },
  });

  if (!user) {
    return reply.status(401).send({ error: 'Unauthorized', message: 'User no longer exists' });
  }

  request.user = user;
}

export async function requireVerified(request: FastifyRequest, reply: FastifyReply) {
  await authenticate(request, reply);
  if (reply.sent) return;

  if (!request.user?.isVerified) {
    return reply.status(403).send({ error: 'Forbidden', message: 'Campus verification required' });
  }
}

export async function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
  await authenticate(request, reply);
  if (reply.sent) return;

  if (request.user?.role !== 'ADMIN') {
    return reply.status(403).send({ error: 'Forbidden', message: 'Admin role required' });
  }
}
