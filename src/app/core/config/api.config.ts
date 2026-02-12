import { InjectionToken } from '@angular/core';

/**
 * API Configuration Interface
 */
export interface ApiConfig {
  readonly baseUrl: string; // e.g., 'https://localhost:7081'
  readonly version: string; // e.g., 'v1', 'v2'
  readonly apiPrefix?: string; // e.g., '/api/v1' (auto-constructed if not provided)
  readonly timeout?: number; // Request timeout in ms
  readonly production: boolean; // Flag for dev/prod behavior
}

export const API_CONFIG = new InjectionToken<ApiConfig>('api.config');

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    // Legacy refresh endpoint (if present)
    REFRESH_TOKEN: '/auth/refresh-token',
    // Standardized refresh endpoint used by frontend refresh flow
    REFRESH: '/auth/refresh',
    // Endpoint to verify current session via cookie
    ME: '/auth/me',
    REGISTER: '/auth/register',
    VERIFY: '/auth/verify',
    VERIFY_EMAIL: '/auth/verify-email',
    RESEND_VERIFICATION: '/auth/resend-verification',
  },
  USERS: {
    LIST: '/users',
    DETAIL: (id: string | number) => `/users/${id}`,
    CREATE: '/users',
    UPDATE: (id: string | number) => `/users/${id}`,
    DELETE: (id: string | number) => `/users/${id}`,
    PROFILE: '/users/profile',
    // New endpoints for user discovery / chat
    SEARCH: '/users/search',
    RECENT_CONTACTS: '/users/recent-contacts',
    SUGGESTIONS: '/users/suggestions',
  },
  PRODUCTS: {
    LIST: '/products',
    DETAIL: (id: string | number) => `/products/${id}`,
    SEARCH: '/products/search',
    CATEGORIES: '/products/categories',
  },
  CHAT: {
    CONVERSATIONS: '/conversations',
    CONVERSATION_MESSAGES: (id: string | number) =>
      `/conversations/${id}/messages`,
    MESSAGES: '/messages',
    USERS_SEARCH: '/users/search',
    ME: '/users/me',
  },
  SIGNALR: {
    NEGOTIATE: '/signalr/negotiate',
    HUB: '/hub/chat',
  },
} as const;

export type ApiEndpoint = string | ((id: string | number) => string);
