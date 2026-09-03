import { User, Category, Listing, LostFoundReport, MatchScoreResult, Claim, Conversation, Message, Notification, ContentReport } from '../types';

const API_BASE = '/api';

export function getAuthToken(): string | null {
  return localStorage.getItem('ce_token');
}

export function setAuthToken(token: string) {
  localStorage.setItem('ce_token', token);
}

export function clearAuthToken() {
  localStorage.removeItem('ce_token');
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || data.error || 'API Request failed');
  }

  return data as T;
}

export const api = {
  // Auth
  register: (body: any) => request<{ message: string; devVerificationToken?: string; user: User }>('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  verify: (body: any) => request<{ message: string; token: string; user: User }>('/auth/verify', { method: 'POST', body: JSON.stringify(body) }),
  login: (body: any) => request<{ message: string; token: string; user: User }>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  logout: () => request<{ message: string }>('/auth/logout', { method: 'POST' }),
  getMe: () => request<{ user: User }>('/auth/me'),

  // Categories
  getCategories: () => request<{ categories: Category[] }>('/categories'),

  // Listings
  getListings: (params: Record<string, string> = {}) => {
    const query = new URLSearchParams(params).toString();
    return request<{ listings: Listing[]; meta: { page: number; total: number; totalPages: number } }>(`/listings${query ? `?${query}` : ''}`);
  },
  getSavedListings: () => request<{ savedListings: Listing[] }>('/listings/saved'),
  getListing: (id: string) => request<{ listing: Listing; isSaved: boolean }>(`/listings/${id}`),
  createListing: (body: any) => request<{ message: string; listing: Listing }>('/listings', { method: 'POST', body: JSON.stringify(body) }),
  updateListing: (id: string, body: any) => request<{ message: string; listing: Listing }>(`/listings/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteListing: (id: string) => request<{ message: string }>(`/listings/${id}`, { method: 'DELETE' }),
  saveListing: (id: string) => request<{ message: string }>(`/listings/${id}/save`, { method: 'POST' }),
  unsaveListing: (id: string) => request<{ message: string }>(`/listings/${id}/save`, { method: 'DELETE' }),

  // Reservations
  reserveListing: (id: string, message?: string) => request<{ message: string }>(`/listings/${id}/reserve`, { method: 'POST', body: JSON.stringify({ message }) }),
  acceptReservation: (id: string, reservationId?: string) => request<{ message: string }>(`/listings/${id}/reserve/accept`, { method: 'POST', body: JSON.stringify({ reservationId }) }),
  rejectReservation: (id: string, reservationId?: string) => request<{ message: string }>(`/listings/${id}/reserve/reject`, { method: 'POST', body: JSON.stringify({ reservationId }) }),
  closeListing: (id: string, finalStatus?: string) => request<{ message: string }>(`/listings/${id}/close`, { method: 'POST', body: JSON.stringify({ finalStatus }) }),

  // Reports
  getReports: (params: Record<string, string> = {}) => {
    const query = new URLSearchParams(params).toString();
    return request<{ reports: LostFoundReport[]; meta: { page: number; total: number; totalPages: number } }>(`/reports${query ? `?${query}` : ''}`);
  },
  getReport: (id: string) => request<{ report: LostFoundReport }>(`/reports/${id}`),
  createReport: (body: any) => request<{ message: string; report: LostFoundReport }>('/reports', { method: 'POST', body: JSON.stringify(body) }),
  updateReport: (id: string, body: any) => request<{ message: string; report: LostFoundReport }>(`/reports/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  getReportMatches: (id: string) => request<{ matches: MatchScoreResult[] }>(`/reports/${id}/matches`),

  // Claims
  createClaim: (reportId: string, body: any) => request<{ message: string; claim: Claim }>(`/reports/${reportId}/claims`, { method: 'POST', body: JSON.stringify(body) }),
  getReportClaims: (reportId: string) => request<{ claims: Claim[] }>(`/reports/${reportId}/claims`),
  updateClaimStatus: (claimId: string, status: string) => request<{ message: string; claim: Claim }>(`/claims/${claimId}`, { method: 'PATCH', body: JSON.stringify({ status }) }),

  // Messaging
  getConversations: () => request<{ conversations: Conversation[] }>('/conversations'),
  createConversation: (recipientId: string, listingId?: string) => request<{ conversation: Conversation }>('/conversations', { method: 'POST', body: JSON.stringify({ recipientId, listingId }) }),
  getMessages: (conversationId: string) => request<{ messages: Message[] }>(`/conversations/${conversationId}/messages`),
  sendMessage: (conversationId: string, content: string) => request<{ message: Message }>(`/conversations/${conversationId}/messages`, { method: 'POST', body: JSON.stringify({ content }) }),

  // Notifications
  getNotifications: () => request<{ notifications: Notification[]; unreadCount: number }>('/notifications'),
  markNotificationRead: (id: string) => request<{ notification: Notification }>(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllNotificationsRead: () => request<{ message: string }>('/notifications/read-all', { method: 'POST' }),

  // Moderation & Upload
  reportContent: (body: any) => request<{ message: string }>('/moderation/reports', { method: 'POST', body: JSON.stringify(body) }),
  getAdminReports: () => request<{ reports: ContentReport[] }>('/admin/reports'),
  actionAdminReport: (id: string, body: any) => request<{ message: string }>(`/admin/reports/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  adminRemoveListing: (id: string, notes?: string) => request<{ message: string }>(`/admin/listings/${id}/remove`, { method: 'PATCH', body: JSON.stringify({ notes }) }),

  // Image Upload
  uploadImage: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const token = getAuthToken();
    const res = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Image upload failed');
    return data.url;
  },
};
