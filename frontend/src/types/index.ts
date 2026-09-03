export type Role = 'STUDENT' | 'ADMIN';
export type ListingType = 'SELL' | 'EXCHANGE' | 'GIVE_AWAY' | 'BUY_REQUEST';
export type ItemCondition = 'NEW' | 'LIKE_NEW' | 'GOOD' | 'FAIR' | 'USED';
export type ListingStatus = 'ACTIVE' | 'RESERVED' | 'SOLD' | 'EXCHANGED' | 'GIVEN_AWAY' | 'CLOSED' | 'REMOVED';
export type ReportType = 'LOST' | 'FOUND';
export type ReportStatus = 'LOST' | 'FOUND' | 'CLAIMED' | 'RESOLVED' | 'CLOSED';
export type ClaimStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';

export interface User {
  id: string;
  email: string;
  name: string;
  department?: string;
  profileImage?: string;
  role: Role;
  isVerified: boolean;
  createdAt?: string;
  _count?: {
    listings?: number;
    wishlists?: number;
    reportsSubmitted?: number;
  };
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
}

export interface ListingImage {
  id: string;
  url: string;
  isPrimary: boolean;
}

export interface Reservation {
  id: string;
  listingId: string;
  buyerId: string;
  status: string;
  message?: string;
  createdAt: string;
  buyer: {
    id: string;
    name: string;
    email?: string;
  };
}

export interface Listing {
  id: string;
  sellerId: string;
  title: string;
  description: string;
  categoryId: string;
  listingType: ListingType;
  price?: number | null;
  condition: ItemCondition;
  location: string;
  status: ListingStatus;
  createdAt: string;
  updatedAt: string;
  seller?: User;
  category?: Category;
  images?: ListingImage[];
  reservations?: Reservation[];
}

export interface ReportImage {
  id: string;
  url: string;
}

export interface LostFoundReport {
  id: string;
  reporterId: string;
  reportType: ReportType;
  title: string;
  description: string;
  categoryId: string;
  location: string;
  dateEvent: string;
  approximateTime?: string;
  distinguishingAttributes?: string;
  visibleAttributes?: string;
  status: ReportStatus;
  createdAt: string;
  updatedAt: string;
  reporter?: User;
  category?: Category;
  images?: ReportImage[];
  claims?: Claim[];
  _count?: {
    claims?: number;
  };
}

export interface MatchScoreResult {
  report: LostFoundReport;
  score: number;
  factors: {
    categoryMatch: number;
    locationSimilarity: number;
    dateSimilarity: number;
    keywordOverlap: number;
    attributeOverlap: number;
  };
  details: string[];
}

export interface Claim {
  id: string;
  reportId: string;
  claimantId: string;
  explanation: string;
  verificationQuestion?: string;
  verificationAnswer?: string;
  status: ClaimStatus;
  createdAt: string;
  claimant?: User;
  report?: LostFoundReport;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  sender?: User;
}

export interface Conversation {
  id: string;
  partner: User;
  listing?: Listing | null;
  lastMessage?: Message | null;
  unreadCount: number;
  updatedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  linkUrl?: string;
  isRead: boolean;
  createdAt: string;
}

export interface ContentReport {
  id: string;
  reporterId: string;
  contentType: 'LISTING' | 'REPORT' | 'USER';
  targetId: string;
  reason: 'SPAM' | 'SUSPICIOUS' | 'INAPPROPRIATE' | 'MISLEADING' | 'ABUSIVE';
  details?: string;
  status: 'PENDING' | 'REVIEWED' | 'DISMISSED' | 'ACTIONED';
  createdAt: string;
  reporter?: User;
}
