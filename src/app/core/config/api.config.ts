import { InjectionToken } from '@angular/core';

// Type-safe endpoint definitions
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    REGISTER: '/auth/register',
  },
  USERS: {
    LIST: '/users',
    DETAIL: (id: string | number) => `/users/${id}`,
    CREATE: '/users',
    UPDATE: (id: string | number) => `/users/${id}`,
    DELETE: (id: string | number) => `/users/${id}`,
  },
  PRODUCTS: {
    LIST: '/products',
    DETAIL: (id: string | number) => `/products/${id}`,
    SEARCH: '/products/search',
  },
} as const;

// Type for API config
export interface ApiConfig {
  baseUrl: string;
  version?: string;
  timeout?: number;
}

// Injection token for DI
export const API_CONFIG = new InjectionToken<ApiConfig>('api.config');
