# Database Schema Documentation - Campus Exchange

The database uses PostgreSQL/SQLite managed through Prisma ORM.

## Key Entities & Relationships

### 1. `User`
- Represents verified campus students and administrators.
- Fields: `id`, `email`, `passwordHash`, `name`, `department`, `isVerified`, `verificationToken`, `role` (`STUDENT`, `ADMIN`), `createdAt`.
- Relations: Has many `listings`, `wishlists`, `reservations`, `reportsSubmitted`, `claimsSubmitted`, `conversations`, `messages`, `notifications`.

### 2. `Category`
- Categorizes listings and lost/found items.
- Fields: `id`, `name`, `slug`, `description`, `icon`.

### 3. `Listing`
- Marketplace listings for selling, exchanging, giving away, or buy requests.
- Fields: `id`, `sellerId`, `title`, `description`, `categoryId`, `listingType` (`SELL`, `EXCHANGE`, `GIVE_AWAY`, `BUY_REQUEST`), `price`, `condition` (`NEW`, `LIKE_NEW`, `GOOD`, `FAIR`, `USED`), `location`, `status` (`ACTIVE`, `RESERVED`, `SOLD`, `EXCHANGED`, `GIVEN_AWAY`, `CLOSED`, `REMOVED`).

### 4. `LostFoundReport`
- Missing or found belongings reports.
- Fields: `id`, `reporterId`, `reportType` (`LOST`, `FOUND`), `title`, `description`, `categoryId`, `location`, `dateEvent`, `approximateTime`, `distinguishingAttributes`, `visibleAttributes`, `status` (`LOST`, `FOUND`, `CLAIMED`, `RESOLVED`, `CLOSED`).

### 5. `Claim`
- Ownership claims submitted on found items.
- Fields: `id`, `reportId`, `claimantId`, `explanation`, `verificationQuestion`, `verificationAnswer`, `status` (`PENDING`, `ACCEPTED`, `REJECTED`, `WITHDRAWN`).

### 6. `Conversation` & `Message`
- One-to-one marketplace chat system.

### 7. `Notification` & `ContentReport` & `ModerationAction`
- Notification alerts and admin moderation audit logs.
