# 🎓 Campus Exchange

> **Student Marketplace & Lost-and-Found Platform**
> A realistic, full-stack portfolio project built with React, TypeScript, Fastify, and Prisma.

---

## 📌 Project Overview

**Campus Exchange** replaces scattered WhatsApp groups and social posts with a single, searchable campus platform.

### Key Features
1. **Campus Verification**: Institutional email verification (`@*.edu` / `@campus.edu`) & dev token verification flow.
2. **Student Marketplace**: Sell, exchange, give away, or request items with condition tags, multi-filter search, pagination, and wishlists.
3. **Reservation Workflow**: Buyer reservation requests with seller accept/reject controls (`ACTIVE` → `RESERVED` → `SOLD`).
4. **Explainable Lost & Found Matching**: Weighted 100-point algorithm matching lost and found reports based on Category (+30), Location (+25), Date (+20), Keywords (+15), and Item Attributes (+10).
5. **Claims & Case Resolution**: Ownership claims with private verification Q&A, single-winner acceptance, and automatic case resolution.
6. **Real-time Messaging & Notifications**: 1-to-1 marketplace chat powered by WebSockets/Socket.io and unread notification alerts.
7. **Admin Moderation**: Content reporting system with an Admin dashboard to inspect reports and remove abusive content.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, TanStack Query, React Router v6, Lucide Icons, Socket.io-client.
- **Backend**: Node.js, TypeScript, Fastify, Zod, Socket.io, JWT auth, bcrypt password hashing.
- **Database**: PostgreSQL / SQLite with Prisma ORM.
- **Testing**: Vitest, Supertest.

---

## 🚀 Quick Setup & Run Commands

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Push database schema & seed sample data
npx prisma db push
npx prisma db seed

# Run development server (runs on http://localhost:5000)
npm run dev
```

### 2. Frontend Setup

```bash
# Open a new terminal and navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Run development server (runs on http://localhost:3000)
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)** in your browser!

---

## 🧪 Running Unit Tests

```bash
# Run backend test suite (Auth, Matching Algorithm, State Machines, Claims)
cd backend
npm test
```

---

## 🔐 Test Accounts (Pre-seeded)

| Role | Email | Password | Description |
| :--- | :--- | :--- | :--- |
| **Student** | `alex.rivera@campus.edu` | `Password123!` | CS Student (Has active listings & lost reports) |
| **Student** | `priya.sharma@campus.edu` | `Password123!` | EE Student (Has calculator listing) |
| **Admin** | `admin.moderator@campus.edu` | `Password123!` | Campus Moderator (Access to `/admin/moderation`) |

---

## 📂 Documentation

- [Architecture Overview](file:///c:/Users/ketha/OneDrive/Desktop/sde/docs/architecture.md)
- [Database Schema](file:///c:/Users/ketha/OneDrive/Desktop/sde/docs/database.md)
- [API Reference](file:///c:/Users/ketha/OneDrive/Desktop/sde/docs/api.md)
