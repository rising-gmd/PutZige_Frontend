import {
  HttpErrorResponse,
  HttpInterceptorFn,
  HttpContextToken,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { NotificationService } from '../../shared/services/notification.service';
import { Router } from '@angular/router';
import { catchError, throwError, timeout, retry, timer } from 'rxjs';

import {
  HTTP_STATUS,
  RETRY_CONFIG,
  REQUEST_CONFIG,
  NOTIFICATION_CONFIG,
} from '../constants/http-status.constants';
import { ROUTE_PATHS } from '../constants/route.constants';
import { ApiErrorResponse } from '../models/error-response.model';
import { STORAGE_KEYS } from '../constants/storage-keys.constants';
import { environment } from '../../../environments/environment';

// Allow callers to opt-out of global error handling
export const SUPPRESS_ERROR_HANDLER = new HttpContextToken<boolean>(
  () => false,
);

const DEFAULT_TIMEOUT_MS = REQUEST_CONFIG.TIMEOUT_MS;

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const suppress = req.context.get(SUPPRESS_ERROR_HANDLER);
  if (suppress) {
    return next(req);
  }

  const translateService = inject(TranslateService);
  const notifications = inject(NotificationService);
  const routerService = inject(Router);

  return next(req).pipe(
    timeout(DEFAULT_TIMEOUT_MS),
    retry({
      count: RETRY_CONFIG.MAX_RETRIES,
      delay: (error, retryCount) => {
        if (shouldRetry(error, retryCount)) {
          return timer(RETRY_CONFIG.RETRY_DELAY_MS * retryCount);
        }
        throw error;
      },
    }),
    catchError((err: unknown) => {
      // Normalize non-HttpErrorResponse errors (fetch/CORS/TypeError from browsers)
      const normalizedError =
        err instanceof HttpErrorResponse
          ? err
          : new HttpErrorResponse({
              error: err,
              status: 0,
              statusText: String(err ?? ''),
            });

      handleError(
        normalizedError,
        translateService,
        notifications,
        routerService,
      );
      return throwError(() => normalizedError);
    }),
  );
};

export function handleError(
  httpError: HttpErrorResponse,
  translateService: TranslateService,
  notifications: NotificationService,
  routerService: Router,
): void {
  // Timeout
  if ((httpError as unknown as { name?: string })?.name === 'TimeoutError') {
    showToast(
      translateService,
      'errors.network.timeout',
      'error',
      undefined,
      notifications,
    );
    return;
  }

  // Network errors (status 0 or missing)
  if (httpError.status === HTTP_STATUS.NETWORK_ERROR || !httpError.status) {
    if (!navigator.onLine) {
      showToast(
        translateService,
        'errors.network.offline',
        'error',
        undefined,
        notifications,
      );
      return;
    }

    const msgParts = [
      httpError.message ?? '',
      String(httpError.statusText ?? ''),
      getErrorBodyMessage(httpError.error) ?? '',
      String(httpError),
      (() => {
        try {
          return JSON.stringify(httpError);
        } catch {
          return '';
        }
      })(),
    ];
    const msg = msgParts.join(' ').toLowerCase();
    // (debugging removed)

    // Backend not running — must check BEFORE CORS because Chrome fires
    // "failed to fetch" on both connection refused and actual CORS failures
    if (isConnectionRefused(msg)) {
      showToast(
        translateService,
        'errors.network.serverUnavailable',
        'error',
        undefined,
        notifications,
      );
      return;
    }

    // Broaden detection for common browser network/CORS messages (incl. Firefox wording)
    if (
      msg.includes('cors') ||
      msg.includes('failed to fetch') ||
      msg.includes('networkerror') ||
      msg.includes('net::err_failed') ||
      msg.includes('blocked') ||
      msg.includes('options') ||
      msg.includes('response body is not available') ||
      msg.includes('missing allow origin') ||
      msg.includes('cors missing allow origin')
    ) {
      showToast(
        translateService,
        'errors.network.cors',
        'error',
        { detail: httpError.message ?? httpError.statusText },
        notifications,
      );
      return;
    }

    showToast(
      translateService,
      'errors.network.unknown',
      'error',
      { detail: httpError.message ?? httpError.statusText },
      notifications,
    );
    return;
  }

  // Authentication
  if (httpError.status === HTTP_STATUS.UNAUTHORIZED) {
    try {
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    } catch (err) {
      if (!environment.production) {
        console.warn('Failed to remove auth token from localStorage', err);
      }
    }

    showToast(
      translateService,
      'errors.auth.tokenExpired',
      'warn',
      undefined,
      notifications,
    );

    setTimeout(() => {
      routerService.navigate([ROUTE_PATHS.AUTH, ROUTE_PATHS.LOGIN], {
        queryParams: { returnUrl: routerService.url },
      });
    }, REQUEST_CONFIG.AUTH_REDIRECT_DELAY_MS);

    return;
  }

  // Authorization
  if (httpError.status === HTTP_STATUS.FORBIDDEN) {
    showToast(
      translateService,
      'errors.auth.forbidden',
      'error',
      undefined,
      notifications,
    );
    return;
  }

  // Not found
  if (httpError.status === HTTP_STATUS.NOT_FOUND) {
    showToast(
      translateService,
      'errors.client.notFound',
      'warn',
      undefined,
      notifications,
    );
    return;
  }

  // Validation errors (400 / 422)
  if (
    httpError.status === HTTP_STATUS.BAD_REQUEST ||
    httpError.status === HTTP_STATUS.UNPROCESSABLE_ENTITY
  ) {
    const apiError = (httpError.error ?? {}) as ApiErrorResponse;

    const apiObj = apiError as unknown as Record<string, unknown>;
    const errs = apiObj['errors'] as Record<string, unknown> | undefined;
    const details = apiObj['details'] as Record<string, unknown> | undefined;

    const hasFieldErrors =
      (errs && Object.keys(errs).length > 0) ||
      (details && Object.keys(details).length > 0);

    if (hasFieldErrors) {
      return;
    }

    // Backend sent a specific message — show it directly
    if (apiError?.message) {
      showToast(
        translateService,
        apiError.message,
        'error',
        undefined,
        notifications,
      );
      return;
    }

    // No message, no errors — fall back to generic
    showToast(
      translateService,
      'errors.client.badRequest',
      'error',
      undefined,
      notifications,
    );
    return;
  }

  // Rate limiting
  if (httpError.status === HTTP_STATUS.TOO_MANY_REQUESTS) {
    const retryAfter =
      httpError.headers?.get?.('Retry-After') ??
      String(REQUEST_CONFIG.DEFAULT_RETRY_AFTER_SECONDS);
    const seconds =
      Number(retryAfter) || REQUEST_CONFIG.DEFAULT_RETRY_AFTER_SECONDS;
    const msg = translateService.instant('errors.rateLimit.tooManyRequests', {
      seconds,
    });
    notifications.show('warn', msg, {
      summary: translateService.instant('errors.titles.warning'),
      life: NOTIFICATION_CONFIG.RATE_LIMIT_LIFE_MS,
    });
    return;
  }

  // Server errors
  if (httpError.status >= HTTP_STATUS.SERVER_ERROR_MIN) {
    if (httpError.status === HTTP_STATUS.SERVICE_UNAVAILABLE) {
      showToast(
        translateService,
        'errors.server.serviceUnavailable',
        'error',
        undefined,
        notifications,
      );
      routerService.navigate([ROUTE_PATHS.MAINTENANCE]);
      return;
    }

    logErrorToMonitoring(httpError);
    showToast(
      translateService,
      'errors.server.internalError',
      'error',
      undefined,
      notifications,
    );
    return;
  }

  // Fallback: use generic client/server messages if available
  if (
    httpError.status >= HTTP_STATUS.CLIENT_ERROR_MIN &&
    httpError.status < HTTP_STATUS.SERVER_ERROR_MIN
  ) {
    showToast(
      translateService,
      'errors.client.badRequest',
      'error',
      undefined,
      notifications,
    );
    return;
  }

  showToast(
    translateService,
    'errors.server.unknown',
    'error',
    undefined,
    notifications,
  );
}

// Chrome: "net::ERR_CONNECTION_REFUSED" | Firefox: "econnrefused" | generic fallback
function isConnectionRefused(msg: string): boolean {
  if (!msg) return false;
  const m = msg.toLowerCase();
  return (
    m.includes('connection refused') ||
    m.includes('err_connection_refused') ||
    m.includes('econnrefused') ||
    m.includes('net::err_connection_refused') ||
    m.includes('net::err_failed') ||
    m.includes('connectionrefused') ||
    m.includes('refused')
  );
}

function showToast(
  translateService: TranslateService,
  messageKey: string,
  severity: 'success' | 'info' | 'warn' | 'error',
  params?: Record<string, unknown>,
  notifications?: NotificationService,
): void {
  const notifierSvc = notifications ?? inject(NotificationService);

  // Guard translation calls so toast still appears if translation lookup fails
  let msg: string;
  let title: string;
  try {
    msg = params
      ? translateService.instant(messageKey, params)
      : translateService.instant(messageKey);
    const titleKey =
      severity === 'error'
        ? 'errors.titles.error'
        : severity === 'warn'
          ? 'errors.titles.warning'
          : 'errors.titles.error';
    title = translateService.instant(titleKey);
  } catch {
    msg = (params && (params['detail'] as string)) || messageKey;
    title =
      severity === 'error'
        ? 'Error'
        : severity === 'warn'
          ? 'Warning'
          : 'Notice';
  }

  const life =
    severity === 'error'
      ? NOTIFICATION_CONFIG.ERROR_LIFE_MS
      : NOTIFICATION_CONFIG.DEFAULT_LIFE_MS;
  notifierSvc.show(severity, msg, { summary: title, life });
}

// Only retry status 0 when user is online and it's not a hard connection refused —
// retrying offline or against a downed server just delays the error toast
export function shouldRetry(error: unknown, retryCount: number): boolean {
  if (retryCount >= RETRY_CONFIG.MAX_RETRIES) {
    return false;
  }

  if (error instanceof HttpErrorResponse) {
    if (error.status === HTTP_STATUS.NETWORK_ERROR) {
      // If the browser is offline, don't retry.
      if (typeof navigator !== 'undefined' && !navigator.onLine) return false;

      // Treat status 0 as a transient network error and retry unless the
      // message indicates a hard connection refusal.
      const msgParts = [
        error.message ?? '',
        String(error.statusText ?? ''),
        getErrorBodyMessage(error.error) ?? '',
        String(error),
        (() => {
          try {
            return JSON.stringify(error);
          } catch {
            return '';
          }
        })(),
      ];
      const msg = msgParts.join(' ').toLowerCase();
      // (debugging removed)
      if (isConnectionRefused(msg)) return false;
      return true;
    }

    // `RETRY_STATUS_CODES` is a readonly tuple; narrow to number[] for includes safely
    const retryCodes = RETRY_CONFIG.RETRY_STATUS_CODES as readonly number[];
    return retryCodes.includes(error.status as number);
  }

  return false;
}

function getErrorBodyMessage(body: unknown): string | undefined {
  if (body == null) return undefined;
  if (typeof body === 'string') return body;
  if (typeof body === 'object') {
    try {
      const b = body as Record<string, unknown>;
      if (typeof b['message'] === 'string') return b['message'] as string;
    } catch {
      return undefined;
    }
  }
  return undefined;
}

export function logErrorToMonitoring(error: HttpErrorResponse): void {
  if (!environment.production) {
    // During dev show sanitized console output
    console.error('Server error:', {
      status: error.status,
      message: error.message,
      url: error.url,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Production: integrate with Sentry/other monitoring here
  try {
    // Example placeholder: Sentry.captureException(error);
  } catch (err) {
    if (!environment.production) {
      console.error('Monitoring integration failed', err);
    }
  }
}
