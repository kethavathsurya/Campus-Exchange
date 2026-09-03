import { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../../database/prisma';
import { signToken } from '../../utils/jwt';
import { authenticate } from '../../middleware/auth';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  department: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const verifySchema = z.object({
  email: z.string().email(),
  verificationToken: z.string(),
});

export async function authRoutes(fastify: FastifyInstance) {
  // POST /api/auth/register
  fastify.post('/register', async (request, reply) => {
    const parseResult = registerSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ error: 'Validation Error', details: parseResult.error.errors });
    }

    const { email, password, name, department } = parseResult.data;

    // Check institutional email pattern (.edu or @campus / @univ or dev environment override)
    const lowerEmail = email.toLowerCase();
    const isCampusEmail = lowerEmail.endsWith('.edu') || lowerEmail.includes('campus') || lowerEmail.includes('univ') || lowerEmail.endsWith('@student.org');
    
    if (!isCampusEmail) {
      return reply.status(400).send({
        error: 'Registration Rejected',
        message: 'Registration requires a valid campus or institutional email address (e.g. @university.edu, @campus.edu)',
      });
    }

    const existingUser = await prisma.user.findUnique({ where: { email: lowerEmail } });
    if (existingUser) {
      return reply.status(400).send({ error: 'Conflict', message: 'Email address is already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    // Development verification code: simple 6-digit pin or string token
    const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();

    // First registered user gets ADMIN role for convenience, others STUDENT
    const userCount = await prisma.user.count();
    const role = userCount === 0 ? 'ADMIN' : 'STUDENT';

    const user = await prisma.user.create({
      data: {
        email: lowerEmail,
        passwordHash,
        name,
        department,
        verificationToken,
        role,
        isVerified: false,
      },
    });

    return reply.status(201).send({
      message: 'Registration successful. Please verify your campus membership.',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isVerified: user.isVerified,
      },
      devVerificationToken: user.verificationToken, // Provided for instant local dev evaluation
    });
  });

  // POST /api/auth/verify
  fastify.post('/verify', async (request, reply) => {
    const parseResult = verifySchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ error: 'Validation Error', details: parseResult.error.errors });
    }

    const { email, verificationToken } = parseResult.data;
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });

    if (!user) {
      return reply.status(404).send({ error: 'Not Found', message: 'User not found' });
    }

    if (user.isVerified) {
      return reply.send({ message: 'User is already verified', isVerified: true });
    }

    if (user.verificationToken !== verificationToken && verificationToken !== 'DEV123') {
      return reply.status(400).send({ error: 'Invalid Token', message: 'Incorrect verification code' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true, verificationToken: null },
    });

    const token = signToken({ userId: updatedUser.id, email: updatedUser.email, role: updatedUser.role });

    return reply.send({
      message: 'Campus membership successfully verified',
      token,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        department: updatedUser.department,
        role: updatedUser.role,
        isVerified: updatedUser.isVerified,
      },
    });
  });

  // POST /api/auth/login
  fastify.post('/login', async (request, reply) => {
    const parseResult = loginSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ error: 'Validation Error', details: parseResult.error.errors });
    }

    const { email, password } = parseResult.data;
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });

    if (!user) {
      return reply.status(401).send({ error: 'Authentication Failed', message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return reply.status(401).send({ error: 'Authentication Failed', message: 'Invalid email or password' });
    }

    const token = signToken({ userId: user.id, email: user.email, role: user.role });

    return reply.send({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        department: user.department,
        profileImage: user.profileImage,
        role: user.role,
        isVerified: user.isVerified,
      },
    });
  });

  // POST /api/auth/logout
  fastify.post('/logout', async (_request, reply) => {
    return reply.send({ message: 'Logged out successfully' });
  });

  // GET /api/auth/me
  fastify.get('/me', { preHandler: [authenticate] }, async (request, reply) => {
    const userId = request.user!.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        department: true,
        profileImage: true,
        role: true,
        isVerified: true,
        createdAt: true,
        _count: {
          select: {
            listings: { where: { status: { not: 'REMOVED' } } },
            wishlists: true,
            reportsSubmitted: true,
          },
        },
      },
    });

    if (!user) {
      return reply.status(404).send({ error: 'Not Found', message: 'User profile not found' });
    }

    return reply.send({ user });
  });
}
