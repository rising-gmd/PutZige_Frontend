import { signal, computed } from '@angular/core';
import type { AuthUser } from '../../models/auth.model';

// Centralized reactive auth state using Angular Signals
// USER → logged-in user object: AuthUser | null
const user = signal<AuthUser | null>(null);

// LOADING → true when auth operations in progress (login/logout/refresh)
const isLoading = signal(false);

// ERROR → stores last auth-related error message
const error = signal<string | null>(null);

// COMPUTED: IS_AUTHENTICATED → true if user object exists
const isAuthenticated = computed(() => user() !== null);

export const authState = {
  user,
  isLoading,
  error,
  isAuthenticated,
  // Read-only accessors for external consumers
  getUser: () => user(),
  isLoggedIn: () => isAuthenticated(),
} as const;
