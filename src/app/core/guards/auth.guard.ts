import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth/auth.service';
import { ROUTE_PATHS } from '../constants/route.constants';

/**
 * AuthGuard: Protect routes that require authentication.
 * - If user is authenticated → allow navigation
 * - If user is NOT authenticated → redirect to login
 */
export const AuthGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated()) {
    return true;
  }

  // Redirect to login with return URL
  const returnUrl = router.getCurrentNavigation()?.finalUrl?.toString() ?? '/';
  return router.createUrlTree([`/${ROUTE_PATHS.AUTH}/${ROUTE_PATHS.LOGIN}`], {
    queryParams: { returnUrl },
  });
};
