import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { buildApp } from '../src/app';
import { prisma } from '../src/database/prisma';
import bcrypt from 'bcryptjs';
import { signToken } from '../src/utils/jwt';

const app = buildApp();

describe('Authorization & Ownership Enforcement', () => {
  let studentAToken: string;
  let studentBToken: string;
  let listingAId: string;

  beforeAll(async () => {
    await app.ready();
    const hash = await bcrypt.hash('Password123!', 10);

    let category = await prisma.category.findFirst();
    if (!category) {
      category = await prisma.category.create({
        data: { name: 'Auth Test Cat', slug: 'auth-test-cat' },
      });
    }

    const userA = await prisma.user.create({
      data: { email: 'studentA.auth@campus.edu', passwordHash: hash, name: 'Student A', isVerified: true, role: 'STUDENT' },
    });

    const userB = await prisma.user.create({
      data: { email: 'studentB.auth@campus.edu', passwordHash: hash, name: 'Student B', isVerified: true, role: 'STUDENT' },
    });

    studentAToken = signToken({ userId: userA.id, email: userA.email, role: 'STUDENT' });
    studentBToken = signToken({ userId: userB.id, email: userB.email, role: 'STUDENT' });

    const listing = await prisma.listing.create({
      data: {
        sellerId: userA.id,
        title: 'Student A Item',
        description: 'Description for student A item',
        categoryId: category.id,
        listingType: 'SELL',
        price: 25.0,
        condition: 'GOOD',
        location: 'West Quad',
        status: 'ACTIVE',
      },
    });
    listingAId = listing.id;
  });

  afterAll(async () => {
    await prisma.listing.deleteMany({ where: { id: listingAId } });
    await prisma.user.deleteMany({ where: { email: { contains: '.auth@campus.edu' } } });
  });

  it('should allow Student A to update their own listing', async () => {
    const res = await request(app.server)
      .patch(`/api/listings/${listingAId}`)
      .set('Authorization', `Bearer ${studentAToken}`)
      .send({ title: 'Student A Updated Title' });

    expect(res.status).toBe(200);
    expect(res.body.listing.title).toBe('Student A Updated Title');
  });

  it('should block Student B from editing Student A listing (403 Forbidden)', async () => {
    const res = await request(app.server)
      .patch(`/api/listings/${listingAId}`)
      .set('Authorization', `Bearer ${studentBToken}`)
      .send({ title: 'Hacked Title By Student B' });

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Forbidden');
  });

  it('should block Student B from accessing Admin Moderation endpoints', async () => {
    const res = await request(app.server)
      .get('/api/admin/reports')
      .set('Authorization', `Bearer ${studentBToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Forbidden');
  });
});
