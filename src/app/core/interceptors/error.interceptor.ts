import {
  HttpErrorResponse,
  HttpInterceptorFn,
  HttpContextToken,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { catchError, retry, throwError, timeout, timer } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  HTTP_STATUS,
  NOTIFICATION_CONFIG,
  REQUEST_CONFIG,
  RETRY_CONFIG,
} from '../constants/http-status.constants';
import { ROUTE_PATHS } from '../constants/route.constants';
import { STORAGE_KEYS } from '../constants/storage-keys.constants';
import { ApiErrorResponse } from '../models/error-response.model';
import { NotificationService } from '../../shared/services/notification.service';
import { mapResponseCode } from '../i18n/response-code-map';
import { API_ENDPOINTS } from '../config/api.config';

export const SUPPRESS_ERROR_HANDLER = new HttpContextToken<boolean>(
  () => false,
);

// ─────────────────────────────────────────────────────────────────────────────
// Interceptor
// ─────────────────────────────────────────────────────────────────────────────

/** Endpoints whose errors are handled by the caller, not globally. */
const SILENT_ERROR_ENDPOINTS = [
  API_ENDPOINTS.AUTH.ME,
  API_ENDPOINTS.AUTH.VERIFY_EMAIL,
  API_ENDPOINTS.AUTH.RESEND_VERIFICATION,
];

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.context.get(SUPPRESS_ERROR_HANDLER)) return next(req);

  // Skip global error handling for endpoints that manage their own errors
  const isSilent = SILENT_ERROR_ENDPOINTS.some((ep) => req.url.includes(ep));
  if (isSilent) return next(req);

  const translate = inject(TranslateService);
  const notifications = inject(NotificationService);
  const router = inject(Router);

  return next(req).pipe(
    timeout(REQUEST_CONFIG.TIMEOUT_MS),
    retry({
      count: RETRY_CONFIG.MAX_RETRIES,
      delay: (error, retryCount) => {
        if (shouldRetry(error, retryCount))
          return timer(RETRY_CONFIG.RETRY_DELAY_MS * retryCount);
        throw error;
      },
    }),
    catchError((err: unknown) => {
      const normalized =
        err instanceof HttpErrorResponse
          ? err
          : new HttpErrorResponse({
              error: err,
              status: 0,
              statusText: String(err ?? ''),
            });

      handleError(normalized, translate, notifications, router);
      return throwError(() => normalized);
    }),
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Error Handler
// ─────────────────────────────────────────────────────────────────────────────

export function handleError(
  error: HttpErrorResponse,
  translate: TranslateService,
  notifications: NotificationService,
  router: Router,
): void {
  // Infrastructure errors - handle globally
  if (isTimeout(error))
    return showToast(translate, 'network.timeout', 'error', notifications);
  if (isNetworkError(error))
    return handleNetworkError(error, translate, notifications);
  if (error.status === HTTP_STATUS.UNAUTHORIZED)
    return handleUnauthorized(translate, notifications, router);
  if (error.status === HTTP_STATUS.FORBIDDEN)
    return showToast(translate, 'auth.forbidden', 'error', notifications);
  if (error.status === HTTP_STATUS.NOT_FOUND)
    return showToast(translate, 'http.not_found', 'warn', notifications);
  if (error.status === HTTP_STATUS.TOO_MANY_REQUESTS)
    return handleRateLimit(error, translate, notifications);
  if (isServerError(error))
    return handleServerError(error, translate, notifications, router);

  // Business logic errors - let component handle if it has responseCode
  if (isValidationError(error)) {
    const apiError = error.error as ApiErrorResponse;
    const hasResponseCode =
      apiError &&
      typeof (apiError as unknown as { responseCode: string }).responseCode ===
        'string';

    if (hasResponseCode) {
      const responseCode = (apiError as unknown as { responseCode: string })
        .responseCode;
      const key = mapResponseCode(responseCode);
      showToast(translate, key, 'error', notifications);
      return;
    }

    // Otherwise, handle field validation errors globally
    if (hasFieldErrors(apiError)) return;

    // Fallback for unknown validation errors
    return showToast(translate, 'http.bad_request', 'error', notifications);
  }

  // Generic client errors
  if (isClientError(error))
    return showToast(translate, 'http.bad_request', 'error', notifications);

  // Final fallback
  showToast(translate, 'http.unknown', 'error', notifications);
}

// ─────────────────────────────────────────────────────────────────────────────
// Specialized Handlers
// ─────────────────────────────────────────────────────────────────────────────

function handleNetworkError(
  error: HttpErrorResponse,
  translate: TranslateService,
  notifications: NotificationService,
): void {
  if (!navigator.onLine)
    return showToast(translate, 'network.offline', 'error', notifications);

  const message = buildErrorMessage(error);

  if (isConnectionRefused(message))
    return showToast(
      translate,
      'network.server_unavailable',
      'error',
      notifications,
    );
  if (isCorsError(message))
    return showToast(translate, 'network.cors', 'error', notifications, {
      detail: error.message ?? error.statusText,
    });

  showToast(translate, 'network.unknown', 'error', notifications, {
    detail: error.message ?? error.statusText,
  });
}

function handleUnauthorized(
  translate: TranslateService,
  notifications: NotificationService,
  router: Router,
): void {
  clearAuthToken();
  showToast(translate, 'auth.token_expired_redirect', 'warn', notifications);

  setTimeout(() => {
    router.navigate([ROUTE_PATHS.AUTH, ROUTE_PATHS.LOGIN], {
      queryParams: { returnUrl: router.url },
    });
  }, REQUEST_CONFIG.AUTH_REDIRECT_DELAY_MS);
}

function handleRateLimit(
  error: HttpErrorResponse,
  translate: TranslateService,
  notifications: NotificationService,
): void {
  const retryAfter =
    error.headers?.get?.('Retry-After') ??
    String(REQUEST_CONFIG.DEFAULT_RETRY_AFTER_SECONDS);
  const seconds =
    Number(retryAfter) || REQUEST_CONFIG.DEFAULT_RETRY_AFTER_SECONDS;
  const message = translate.instant('http.rate_limit', { seconds });

  notifications.show('warn', message, {
    summary: translate.instant('global.warning'),
    life: NOTIFICATION_CONFIG.RATE_LIMIT_LIFE_MS,
  });
}

function handleServerError(
  error: HttpErrorResponse,
  translate: TranslateService,
  notifications: NotificationService,
  router: Router,
): void {
  if (error.status === HTTP_STATUS.SERVICE_UNAVAILABLE) {
    showToast(translate, 'http.service_unavailable', 'error', notifications);
    router.navigate([ROUTE_PATHS.MAINTENANCE]);
    return;
  }

  logErrorToMonitoring(error);
  showToast(translate, 'http.internal_error', 'error', notifications);
}

// ─────────────────────────────────────────────────────────────────────────────
// Type Guards & Checks
// ─────────────────────────────────────────────────────────────────────────────

function isTimeout(error: HttpErrorResponse): boolean {
  return (error as unknown as { name?: string })?.name === 'TimeoutError';
}

function isNetworkError(error: HttpErrorResponse): boolean {
  return error.status === HTTP_STATUS.NETWORK_ERROR || !error.status;
}

function isValidationError(error: HttpErrorResponse): boolean {
  return (
    error.status === HTTP_STATUS.BAD_REQUEST ||
    error.status === HTTP_STATUS.UNPROCESSABLE_ENTITY
  );
}

function isServerError(error: HttpErrorResponse): boolean {
  return error.status >= HTTP_STATUS.SERVER_ERROR_MIN;
}

function isClientError(error: HttpErrorResponse): boolean {
  return (
    error.status >= HTTP_STATUS.CLIENT_ERROR_MIN &&
    error.status < HTTP_STATUS.SERVER_ERROR_MIN
  );
}

function hasFieldErrors(apiError: ApiErrorResponse): boolean {
  const obj = apiError as unknown as Record<string, unknown>;
  const errors = obj['errors'] as Record<string, unknown> | undefined;
  const details = obj['details'] as Record<string, unknown> | undefined;
  return !!(
    (errors && Object.keys(errors).length > 0) ||
    (details && Object.keys(details).length > 0)
  );
}

function isConnectionRefused(message: string): boolean {
  if (!message) return false;
  const indicators = [
    'connection refused',
    'err_connection_refused',
    'econnrefused',
    'net::err_connection_refused',
    'net::err_failed',
    'connectionrefused',
    'refused',
  ];
  return indicators.some((indicator) => message.includes(indicator));
}

function isCorsError(message: string): boolean {
  const indicators = [
    'cors',
    'failed to fetch',
    'networkerror',
    'net::err_failed',
    'blocked',
    'options',
    'response body is not available',
    'missing allow origin',
  ];
  return indicators.some((indicator) => message.includes(indicator));
}

// ─────────────────────────────────────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────────────────────────────────────

function buildErrorMessage(error: HttpErrorResponse): string {
  const parts = [
    error.message ?? '',
    String(error.statusText ?? ''),
    extractErrorMessage(error.error) ?? '',
    String(error),
  ];

  try {
    parts.push(JSON.stringify(error));
  } catch {
    // Ignore serialization errors
  }

  return parts.join(' ').toLowerCase();
}

function extractErrorMessage(error: unknown): string | undefined {
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object') {
    const val = (error as Record<string, unknown>)['message'];
    if (typeof val === 'string') return val;
    if (val != null) return String(val);
  }
  return undefined;
}

function clearAuthToken(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
  } catch (err) {
    if (!environment.production)
      console.warn('Failed to remove auth token', err);
  }
}

function showToast(
  translate: TranslateService,
  messageKey: string,
  severity: 'success' | 'info' | 'warn' | 'error',
  notifications: NotificationService,
  params?: Record<string, unknown>,
): void {
  let message: string;
  let title: string;

  try {
    message = params
      ? translate.instant(messageKey, params)
      : translate.instant(messageKey);
    const titleKey = severity === 'warn' ? 'global.warning' : 'global.error';
    title = translate.instant(titleKey);
  } catch {
    message = (params?.['detail'] as string) || messageKey;
    title = severity === 'warn' ? 'Warning' : 'Error';
  }

  const life =
    severity === 'error'
      ? NOTIFICATION_CONFIG.ERROR_LIFE_MS
      : NOTIFICATION_CONFIG.DEFAULT_LIFE_MS;
  notifications.show(severity, message, { summary: title, life });
}

export function shouldRetry(error: unknown, retryCount: number): boolean {
  if (retryCount >= RETRY_CONFIG.MAX_RETRIES) return false;
  if (!(error instanceof HttpErrorResponse)) return false;

  if (error.status === HTTP_STATUS.NETWORK_ERROR) {
    if (typeof navigator !== 'undefined' && !navigator.onLine) return false;

    const message = buildErrorMessage(error);
    if (isConnectionRefused(message)) return false;

    return true;
  }

  const retryCodes = RETRY_CONFIG.RETRY_STATUS_CODES as readonly number[];
  return retryCodes.includes(error.status as number);
}

export function logErrorToMonitoring(error: HttpErrorResponse): void {
  if (!environment.production) {
    console.error('Server error:', {
      status: error.status,
      message: error.message,
      url: error.url,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  try {
    // Production monitoring integration (Sentry, DataDog, etc.)
  } catch (err) {
    if (!environment.production)
      console.error('Monitoring integration failed', err);
  }
}
