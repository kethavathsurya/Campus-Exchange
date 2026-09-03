import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { buildApp } from '../src/app';
import { prisma } from '../src/database/prisma';

const app = buildApp();

describe('Auth & Campus Verification API', () => {
  beforeAll(async () => {
    await app.ready();
    await prisma.user.deleteMany({ where: { email: { contains: 'testunit' } } });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: { contains: 'testunit' } } });
  });

  it('should reject registration for non-campus email domains', async () => {
    const res = await request(app.server)
      .post('/api/auth/register')
      .send({
        email: 'attacker@gmail.com',
        password: 'Password123!',
        name: 'Attacker User',
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Registration Rejected');
  });

  it('should accept registration for institutional campus email (.edu)', async () => {
    const res = await request(app.server)
      .post('/api/auth/register')
      .send({
        email: 'student.testunit@campus.edu',
        password: 'Password123!',
        name: 'Test Student',
      });

    expect(res.status).toBe(201);
    expect(res.body.user.isVerified).toBe(false);
    expect(res.body.devVerificationToken).toBeDefined();
  });

  it('should verify campus email with correct verification token', async () => {
    // First register
    const regRes = await request(app.server)
      .post('/api/auth/register')
      .send({
        email: 'student.verify.testunit@campus.edu',
        password: 'Password123!',
        name: 'Verify Student',
      });

    const devToken = regRes.body.devVerificationToken;

    // Verify token
    const verifyRes = await request(app.server)
      .post('/api/auth/verify')
      .send({
        email: 'student.verify.testunit@campus.edu',
        verificationToken: devToken,
      });

    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.token).toBeDefined();
    expect(verifyRes.body.user.isVerified).toBe(true);
  });
});
