import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { buildApp } from '../src/app';
import { prisma } from '../src/database/prisma';
import bcrypt from 'bcryptjs';
import { signToken } from '../src/utils/jwt';

const app = buildApp();

describe('Reservation Concurrency & Lifecycle', () => {
  let sellerToken: string;
  let buyer1Token: string;
  let buyer2Token: string;
  let listingId: string;

  beforeAll(async () => {
    await app.ready();
    const hash = await bcrypt.hash('Password123!', 10);

    let category = await prisma.category.findFirst();
    if (!category) {
      category = await prisma.category.create({
        data: { name: 'Res Test Cat', slug: 'res-test-cat' },
      });
    }

    const seller = await prisma.user.create({
      data: { email: 'seller.res@campus.edu', passwordHash: hash, name: 'Seller User', isVerified: true },
    });
    const buyer1 = await prisma.user.create({
      data: { email: 'buyer1.res@campus.edu', passwordHash: hash, name: 'Buyer One', isVerified: true },
    });
    const buyer2 = await prisma.user.create({
      data: { email: 'buyer2.res@campus.edu', passwordHash: hash, name: 'Buyer Two', isVerified: true },
    });

    sellerToken = signToken({ userId: seller.id, email: seller.email, role: 'STUDENT' });
    buyer1Token = signToken({ userId: buyer1.id, email: buyer1.email, role: 'STUDENT' });
    buyer2Token = signToken({ userId: buyer2.id, email: buyer2.email, role: 'STUDENT' });

    const listing = await prisma.listing.create({
      data: {
        sellerId: seller.id,
        title: 'Concurrent Reserve Test Item',
        description: 'Test description long enough',
        categoryId: category.id,
        listingType: 'SELL',
        price: 50.0,
        condition: 'GOOD',
        location: 'Library',
        status: 'ACTIVE',
      },
    });
    listingId = listing.id;
  });

  afterAll(async () => {
    await prisma.reservation.deleteMany({ where: { listingId } });
    await prisma.listing.deleteMany({ where: { id: listingId } });
    await prisma.user.deleteMany({ where: { email: { contains: '.res@campus.edu' } } });
  });

  it('should allow Buyer 1 and Buyer 2 to submit pending reservation requests on ACTIVE listing', async () => {
    const res1 = await request(app.server)
      .post(`/api/listings/${listingId}/reserve`)
      .set('Authorization', `Bearer ${buyer1Token}`)
      .send({ message: 'Buyer 1 request' });

    expect(res1.status).toBe(201);

    const res2 = await request(app.server)
      .post(`/api/listings/${listingId}/reserve`)
      .set('Authorization', `Bearer ${buyer2Token}`)
      .send({ message: 'Buyer 2 request' });

    expect(res2.status).toBe(201);
  });

  it('should atomically accept Buyer 1 reservation, mark listing RESERVED, and reject Buyer 2 request', async () => {
    const acceptRes = await request(app.server)
      .post(`/api/listings/${listingId}/reserve/accept`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({});

    expect(acceptRes.status).toBe(200);

    const listing = await prisma.listing.findUnique({ where: { id: listingId } });
    expect(listing?.status).toBe('RESERVED');

    const buyer2Reservation = await prisma.reservation.findFirst({
      where: { listingId, buyer: { email: 'buyer2.res@campus.edu' } },
    });
    expect(buyer2Reservation?.status).toBe('REJECTED');
  });

  it('should block new reservation attempts when listing is no longer ACTIVE', async () => {
    const res3 = await request(app.server)
      .post(`/api/listings/${listingId}/reserve`)
      .set('Authorization', `Bearer ${buyer2Token}`)
      .send({});

    expect(res3.status).toBe(409);
    expect(res3.body.error).toBe('Reservation Error');
  });
});
