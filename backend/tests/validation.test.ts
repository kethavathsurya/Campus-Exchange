import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { buildApp } from '../src/app';

const app = buildApp();

describe('API Input Validation & Rate Limiting', () => {
  beforeAll(async () => {
    await app.ready();
  });

  it('should reject registration with invalid email format (400 Bad Request)', async () => {
    const res = await request(app.server)
      .post('/api/auth/register')
      .send({
        email: 'invalid-email-address',
        password: 'Password123!',
        name: 'Test Name',
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation Error');
  });

  it('should reject registration with password under 6 characters', async () => {
    const res = await request(app.server)
      .post('/api/auth/register')
      .send({
        email: 'short.pass@campus.edu',
        password: '123',
        name: 'Short Pass',
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation Error');
  });

  it('should reject unauthenticated upload attempt (401 Unauthorized)', async () => {
    const res = await request(app.server)
      .post('/api/upload');

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Unauthorized');
  });
});
