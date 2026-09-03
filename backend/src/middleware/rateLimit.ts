import { FastifyRequest, FastifyReply } from 'fastify';

interface RateLimitStore {
  count: number;
  resetTime: number;
}

const ipStore = new Map<string, RateLimitStore>();

export function createRateLimiter(maxRequests: number, windowMs: number) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const ip = request.ip || request.socket.remoteAddress || '127.0.0.1';
    const now = Date.now();

    const record = ipStore.get(ip);
    if (!record || now > record.resetTime) {
      ipStore.set(ip, { count: 1, resetTime: now + windowMs });
      return;
    }

    if (record.count >= maxRequests) {
      return reply.status(429).send({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please wait a moment before trying again.',
      });
    }

    record.count += 1;
  };
}

export const authRateLimiter = createRateLimiter(10, 60 * 1000); // 10 attempts per minute
export const uploadRateLimiter = createRateLimiter(20, 60 * 1000); // 20 uploads per minute
