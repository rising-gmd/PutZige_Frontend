import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth/auth.service';
import { ROUTE_PATHS } from '../constants/route.constants';

/**
 * GuestGuard: Protect routes that should only be accessible to guests.
 * - If user is NOT authenticated → allow navigation (e.g., login/register pages)
 * - If user IS authenticated → redirect to chat (or home)
 */
export const GuestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return true;
  }

  // User is already logged in → redirect to chat
  return router.createUrlTree([`/${ROUTE_PATHS.CHAT}`]);
};
