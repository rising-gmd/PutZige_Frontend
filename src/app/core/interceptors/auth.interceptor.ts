import { inject } from '@angular/core';
import {
  type HttpInterceptorFn,
  HttpErrorResponse,
} from '@angular/common/http';
import { Router } from '@angular/router';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth/auth.service';
import { ROUTE_PATHS } from '../constants/route.constants';

/**
 * AuthInterceptor: Attach JWT access token to outgoing requests.
 * - Adds Authorization header with Bearer token to all API requests
 * - Handles 401 responses by logging out the user
 * - Skips auth header for login/register/public endpoints
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // Skip auth header for public endpoints
  const publicEndpoints = [
    '/auth/login',
    '/auth/refresh-token',
    '/register',
    '/auth/verify-email',
  ];
  const isPublic = publicEndpoints.some((endpoint) =>
    req.url.includes(endpoint),
  );

  if (isPublic) {
    return next(req);
  }

  const token = auth.getAccessToken();

  // Clone request and add Authorization header if token exists
  const authReq = token
    ? req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      })
    : req;

  return next(authReq).pipe(
    catchError((error: unknown) => {
      // 401 Unauthorized → logout user and redirect to login
      if (error instanceof HttpErrorResponse && error.status === 401) {
        auth.logout();
        void router.navigate([`/${ROUTE_PATHS.AUTH}/${ROUTE_PATHS.LOGIN}`]);
      }

      return throwError(() => error);
    }),
  );
};
