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
  const notificationSvc = inject(NotificationService);

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
        notificationSvc,
        routerService,
      );
      return throwError(() => normalizedError);
    }),
  );
};

export function handleError(
  httpError: HttpErrorResponse,
  translateService: TranslateService,
  notificationSvc: NotificationService,
  routerService: Router,
): void {
  // Timeout
  if ((httpError as unknown as { name?: string })?.name === 'TimeoutError') {
    showToast(
      translateService,
      'errors.network.timeout',
      'error',
      undefined,
      notificationSvc,
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
        notificationSvc,
      );
      return;
    }

    const msg = (
      httpError.message ?? String(httpError.statusText ?? '')
    ).toLowerCase();

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
        notificationSvc,
      );
      return;
    }
    showToast(
      translateService,
      'errors.network.unknown',
      'error',
      { detail: httpError.message ?? httpError.statusText },
      notificationSvc,
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
      notificationSvc,
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
      notificationSvc,
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
      notificationSvc,
    );
    return;
  }

  // Validation errors (400 / 422)
  if (
    httpError.status === HTTP_STATUS.BAD_REQUEST ||
    httpError.status === HTTP_STATUS.UNPROCESSABLE_ENTITY
  ) {
    const apiError = (httpError.error ?? {}) as ApiErrorResponse;
    if (apiError?.details && Object.keys(apiError.details).length > 0) {
      // Let the component handle inline validation by attaching details to the error object
      return;
    }

    showToast(
      translateService,
      'errors.client.badRequest',
      'error',
      undefined,
      notificationSvc,
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
    notificationSvc.show('warn', msg, {
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
        notificationSvc,
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
      notificationSvc,
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
      notificationSvc,
    );
    return;
  }
  showToast(
    translateService,
    'errors.server.unknown',
    'error',
    undefined,
    notificationSvc,
  );
}

function showToast(
  translateService: TranslateService,
  messageKey: string,
  severity: 'success' | 'info' | 'warn' | 'error',
  params?: Record<string, unknown>,
  notificationSvc?: NotificationService,
): void {
  const notifierSvc = notificationSvc ?? inject(NotificationService);

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

// showToastMessage removed: NotificationService.show replaces direct MessageService calls

export function shouldRetry(error: unknown, retryCount: number): boolean {
  if (retryCount >= RETRY_CONFIG.MAX_RETRIES) {
    return false;
  }

  if (error instanceof HttpErrorResponse) {
    // Network blip
    if (error.status === HTTP_STATUS.NETWORK_ERROR) {
      return true;
    }

    // `RETRY_STATUS_CODES` is a readonly tuple; narrow to number[] for includes safely
    const retryCodes = RETRY_CONFIG.RETRY_STATUS_CODES as readonly number[];
    return retryCodes.includes(error.status as number);
  }

  return false;
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
