# Architecture Overview - Campus Exchange

Campus Exchange is structured as a **modular monolith** with clear boundary separation between modules.

```
                    ┌─────────────────────────┐
                    │  React + TypeScript UI  │
                    │   (Vite, Tailwind CSS)  │
                    └────────────┬────────────┘
                                 │ HTTP / Socket.io
                    ┌────────────▼────────────┐
                    │    Fastify API Server   │
                    └────────────┬────────────┘
                                 │
     ┌───────────────────────────┼───────────────────────────┐
     │                           │                           │
┌────▼──────┐              ┌─────▼─────┐               ┌─────▼─────┐
│ Auth &    │              │Marketplace│               │Lost & Found│
│ Verification             │ & Res.    │               │ & Matching│
└────┬──────┘              └─────┬─────┘               └─────┬─────┘
     │                           │                           │
     └───────────────────────────┼───────────────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │   Prisma ORM & SQLite   │
                    └─────────────────────────┘
```

## System Components

1. **Frontend Client (`frontend/`)**
   - React 18, TypeScript, Vite, Tailwind CSS, TanStack Query, React Router v6.
   - Single-Page Application (SPA) architecture with responsive design, search filters, state machine badge components, and real-time Socket.io chat handlers.

2. **Backend API Server (`backend/`)**
   - Fastify web framework for high performance and lightweight routing.
   - Modular monolith structure split into domain modules: `auth`, `listings`, `reservations`, `lostfound`, `claims`, `messaging`, `notifications`, `moderation`.
   - Explainable lost & found matching algorithm (`matchingService.ts`).
   - Real-time event broadcasting using Socket.io.

3. **Data Access Layer**
   - Prisma ORM providing strict TypeScript schema safety, relations, and state transition integrity.
