import { inject } from '@angular/core';
import {
  type HttpInterceptorFn,
  HttpErrorResponse,
} from '@angular/common/http';
import { Router } from '@angular/router';
import { throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { AuthService } from '../services/auth/auth.service';
import { ROUTE_PATHS } from '../constants/route.constants';
import { API_ENDPOINTS } from '../config/api.config';

function getCookie(name: string): string | null {
  try {
    const cookies = document.cookie ? document.cookie.split('; ') : [];
    for (const c of cookies) {
      const [k, v] = c.split('=');
      if (k === name) return decodeURIComponent(v || '');
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * AuthInterceptor for cookie-based auth.
 * - Ensures `withCredentials: true` on all requests
 * - Adds CSRF header when XSRF-TOKEN cookie present
 * - On 401, attempts a single-flight refresh and retries the original request
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // Public endpoints that should not trigger refresh logic (use centralized endpoints)
  const publicEndpoints = [
    API_ENDPOINTS.AUTH.LOGIN,
    API_ENDPOINTS.AUTH.REFRESH,
    API_ENDPOINTS.AUTH.REFRESH_TOKEN ?? API_ENDPOINTS.AUTH.REFRESH_TOKEN,
    API_ENDPOINTS.AUTH.LOGOUT,
    API_ENDPOINTS.AUTH.VERIFY_EMAIL,
    API_ENDPOINTS.SIGNALR.NEGOTIATE,
  ];

  const isPublic = publicEndpoints.some((e) => {
    if (!e) return false;
    return req.url.includes(typeof e === 'string' ? e : String(e));
  });

  // Attach withCredentials and XSRF header if present
  const xsrfToken = getCookie('XSRF-TOKEN');
  const modifiedReq = req.clone({
    withCredentials: true,
    setHeaders: xsrfToken ? { 'X-XSRF-TOKEN': xsrfToken } : {},
  });

  if (isPublic) return next(modifiedReq);

  return next(modifiedReq).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse && err.status === 401) {
        // If auth.refreshAccessToken() is already running, it will return the same observable
        return auth.refreshAccessToken().pipe(
          switchMap((success) => {
            if (success) {
              // retry original request once
              const retryReq = req.clone({
                withCredentials: true,
                setHeaders: xsrfToken ? { 'X-XSRF-TOKEN': xsrfToken } : {},
              });
              return next(retryReq);
            }
            // Refresh failed — force logout and navigate to login
            auth.logout();
            void router.navigate([`/${ROUTE_PATHS.AUTH}/${ROUTE_PATHS.LOGIN}`]);
            return throwError(() => err);
          }),
        );
      }

      return throwError(() => err);
    }),
  );
};
