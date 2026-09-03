# API Endpoint Reference - Campus Exchange

Base URL: `/api`

## Authentication (`/api/auth`)
- `POST /api/auth/register` - Register student with campus email (`@*.edu` / `@campus.edu`)
- `POST /api/auth/verify` - Verify campus membership token
- `POST /api/auth/login` - Login student/admin
- `POST /api/auth/logout` - Logout user session
- `GET  /api/auth/me` - Get current authenticated user profile

## Marketplace Listings (`/api/listings`)
- `GET    /api/listings` - Search, filter, and paginate active listings
- `POST   /api/listings` - Create new listing (Protected + Verified)
- `GET    /api/listings/:id` - Get listing details & seller info
- `PATCH  /api/listings/:id` - Update listing / status transition (Owner/Admin)
- `DELETE /api/listings/:id` - Remove listing (Owner/Admin)
- `GET    /api/listings/saved` - Get saved wishlist items
- `POST   /api/listings/:id/save` - Save item to wishlist
- `DELETE /api/listings/:id/save` - Remove item from wishlist

## Reservations (`/api/listings`)
- `POST /api/listings/:id/reserve` - Buyer requests item reservation
- `POST /api/listings/:id/reserve/accept` - Seller accepts reservation (`ACTIVE` -> `RESERVED`)
- `POST /api/listings/:id/reserve/reject` - Seller declines reservation
- `POST /api/listings/:id/close` - Seller marks listing as `SOLD` / `CLOSED`

## Lost & Found Reports (`/api/reports`)
- `GET   /api/reports` - Search and filter lost/found reports
- `POST  /api/reports` - Create lost or found report
- `GET   /api/reports/:id` - View report details
- `PATCH /api/reports/:id` - Update report status
- `GET   /api/reports/:id/matches` - Run explainable matching score engine

## Claims (`/api`)
- `POST  /api/reports/:id/claims` - Submit ownership claim on found item
- `GET   /api/reports/:id/claims` - View report claims (Owner/Claimant)
- `PATCH /api/claims/:id` - Accept/reject claim (Accept resolves case)

## Messaging (`/api`)
- `GET  /api/conversations` - List active conversations & unread counts
- `POST /api/conversations` - Start or fetch conversation with user
- `GET  /api/conversations/:id/messages` - Fetch chat history
- `POST /api/conversations/:id/messages` - Send chat message

## Admin Moderation (`/api`)
- `POST  /api/moderation/reports` - Report content (Student)
- `GET   /api/admin/reports` - Review moderation queue (Admin)
- `PATCH /api/admin/reports/:id` - Dismiss or action report (Admin)
- `PATCH /api/admin/listings/:id/remove` - Remove reported listing (Admin)
