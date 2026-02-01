import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import {
  shouldRetry,
  logErrorToMonitoring,
  handleError,
} from './error.interceptor';
import {
  RETRY_CONFIG,
  HTTP_STATUS,
  NOTIFICATION_CONFIG,
  REQUEST_CONFIG,
} from '../constants/http-status.constants';

// ─── helpers ────────────────────────────────────────────────────────────────

const makeTranslate = (impl?: (key: string, params?: any) => string) =>
  ({ instant: impl ?? ((k: string) => k) }) as any;

const makeNotifier = () => ({ show: jest.fn() }) as any;
const makeRouter = () => ({ navigate: jest.fn(), url: '/current' }) as any;

function setOnline(value: boolean) {
  Object.defineProperty(navigator, 'onLine', {
    value,
    configurable: true,
  });
}

// ─── shouldRetry ────────────────────────────────────────────────────────────

describe('shouldRetry()', () => {
  beforeEach(() => setOnline(true));

  it('when retryCount >= MAX_RETRIES, then returns false', () => {
    const err = new HttpErrorResponse({ status: 0 });
    expect(shouldRetry(err, RETRY_CONFIG.MAX_RETRIES)).toBe(false);
  });

  it('when online and status 0 with no connection-refused message, then returns true', () => {
    const err = new HttpErrorResponse({
      status: HTTP_STATUS.NETWORK_ERROR,
      message: 'some blip',
    });
    expect(shouldRetry(err, 0)).toBe(true);
  });

  it('when offline and status 0, then returns false', () => {
    setOnline(false);
    const err = new HttpErrorResponse({ status: HTTP_STATUS.NETWORK_ERROR });
    expect(shouldRetry(err, 0)).toBe(false);
  });

  it('when status 0 with connection refused message, then returns false', () => {
    const err = new HttpErrorResponse({
      status: HTTP_STATUS.NETWORK_ERROR,
      error: 'net::ERR_CONNECTION_REFUSED',
    });
    expect(shouldRetry(err, 0)).toBe(false);
  });

  it('when status is in RETRY_STATUS_CODES, then returns true', () => {
    const code = (RETRY_CONFIG.RETRY_STATUS_CODES as readonly number[])[0];
    const err = new HttpErrorResponse({ status: code });
    expect(shouldRetry(err, 0)).toBe(true);
  });

  it('when error is not HttpErrorResponse, then returns false', () => {
    expect(shouldRetry(new Error('boom'), 0)).toBe(false);
  });
});

// ─── logErrorToMonitoring ───────────────────────────────────────────────────

describe('logErrorToMonitoring()', () => {
  it('when not production, then logs sanitized error to console.error', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const err = new HttpErrorResponse({
      status: 500,
      statusText: 'err',
      url: '/x',
      error: 'o',
    });

    logErrorToMonitoring(err);

    expect(spy).toHaveBeenCalledWith(
      'Server error:',
      expect.objectContaining({ status: 500, url: '/x' }),
    );
    spy.mockRestore();
  });
});

// ─── handleError ────────────────────────────────────────────────────────────

describe('handleError()', () => {
  beforeEach(() => setOnline(true));

  // ── Timeout ───────────────────────────────────────────────────────────────

  it('when TimeoutError, then shows timeout toast', () => {
    const notifier = makeNotifier();
    handleError(
      { name: 'TimeoutError' } as any,
      makeTranslate(),
      notifier,
      makeRouter(),
    );
    expect(notifier.show).toHaveBeenCalledWith(
      'error',
      'errors.network.timeout',
      expect.any(Object),
    );
  });

  // ── Network / offline / connection refused / CORS ─────────────────────────

  it('when offline, then shows offline toast', () => {
    setOnline(false);
    const notifier = makeNotifier();
    handleError(
      new HttpErrorResponse({ status: 0, message: 'fail' }) as any,
      makeTranslate(),
      notifier,
      makeRouter(),
    );
    expect(notifier.show).toHaveBeenCalledWith(
      'error',
      'errors.network.offline',
      expect.any(Object),
    );
  });

  it('when connection refused, then shows serverUnavailable toast', () => {
    const notifier = makeNotifier();
    handleError(
      new HttpErrorResponse({
        status: 0,
        error: 'net::ERR_CONNECTION_REFUSED',
      }) as any,
      makeTranslate(),
      notifier,
      makeRouter(),
    );
    expect(notifier.show).toHaveBeenCalledWith(
      'error',
      'errors.network.serverUnavailable',
      expect.any(Object),
    );
  });

  it('when CORS-like message, then shows cors toast', () => {
    const notifier = makeNotifier();
    handleError(
      new HttpErrorResponse({
        status: 0,
        error: 'Failed to fetch',
      }) as any,
      makeTranslate(),
      notifier,
      makeRouter(),
    );
    expect(notifier.show).toHaveBeenCalledWith(
      'error',
      'errors.network.cors',
      expect.any(Object),
    );
  });

  it('when unknown network error, then shows unknown toast', () => {
    const notifier = makeNotifier();
    handleError(
      new HttpErrorResponse({
        status: 0,
        message: 'something weird',
      }) as any,
      makeTranslate(),
      notifier,
      makeRouter(),
    );
    expect(notifier.show).toHaveBeenCalledWith(
      'error',
      'errors.network.unknown',
      expect.any(Object),
    );
  });

  // ── Auth ──────────────────────────────────────────────────────────────────

  it('when UNAUTHORIZED, then clears token, shows toast, and navigates after delay', () => {
    jest.useFakeTimers();
    const notifier = makeNotifier();
    const router = makeRouter();
    const removeSpy = jest.spyOn(Storage.prototype, 'removeItem');

    handleError(
      new HttpErrorResponse({ status: HTTP_STATUS.UNAUTHORIZED }) as any,
      makeTranslate(),
      notifier,
      router,
    );

    expect(removeSpy).toHaveBeenCalled();
    expect(notifier.show).toHaveBeenCalledWith(
      'warn',
      'errors.auth.tokenExpired',
      expect.any(Object),
    );

    jest.advanceTimersByTime(REQUEST_CONFIG.AUTH_REDIRECT_DELAY_MS + 10);
    expect(router.navigate).toHaveBeenCalledWith(
      expect.any(Array),
      expect.objectContaining({ queryParams: { returnUrl: '/current' } }),
    );

    removeSpy.mockRestore();
    jest.useRealTimers();
  });

  it('when FORBIDDEN, then shows forbidden toast', () => {
    const notifier = makeNotifier();
    handleError(
      new HttpErrorResponse({ status: HTTP_STATUS.FORBIDDEN }) as any,
      makeTranslate(),
      notifier,
      makeRouter(),
    );
    expect(notifier.show).toHaveBeenCalledWith(
      'error',
      'errors.auth.forbidden',
      expect.any(Object),
    );
  });

  // ── Not Found ─────────────────────────────────────────────────────────────

  it('when NOT_FOUND, then shows notFound toast', () => {
    const notifier = makeNotifier();
    handleError(
      new HttpErrorResponse({ status: HTTP_STATUS.NOT_FOUND }) as any,
      makeTranslate(),
      notifier,
      makeRouter(),
    );
    expect(notifier.show).toHaveBeenCalledWith(
      'warn',
      'errors.client.notFound',
      expect.any(Object),
    );
  });

  // ── Validation (400 / 422) ────────────────────────────────────────────────

  it('when BAD_REQUEST with field errors, then does not show toast (component handles inline)', () => {
    const notifier = makeNotifier();
    // backend sends "errors" not "details"
    const apiError = {
      errors: { email: ['Already registered'] },
      message: 'Validation failed',
    };
    handleError(
      new HttpErrorResponse({
        status: HTTP_STATUS.BAD_REQUEST,
        error: apiError,
      }) as any,
      makeTranslate(),
      notifier,
      makeRouter(),
    );
    expect(notifier.show).not.toHaveBeenCalled();
  });

  it('when BAD_REQUEST with server message only, then shows that message directly', () => {
    const notifier = makeNotifier();
    const apiError = {
      message: 'This email address is already registered.',
    };
    handleError(
      new HttpErrorResponse({
        status: HTTP_STATUS.BAD_REQUEST,
        error: apiError,
      }) as any,
      makeTranslate(),
      notifier,
      makeRouter(),
    );
    expect(notifier.show).toHaveBeenCalledWith(
      'error',
      'This email address is already registered.',
      expect.any(Object),
    );
  });

  it('when BAD_REQUEST with no message and no errors, then shows generic badRequest toast', () => {
    const notifier = makeNotifier();
    handleError(
      new HttpErrorResponse({
        status: HTTP_STATUS.BAD_REQUEST,
        error: {},
      }) as any,
      makeTranslate(),
      notifier,
      makeRouter(),
    );
    expect(notifier.show).toHaveBeenCalledWith(
      'error',
      'errors.client.badRequest',
      expect.any(Object),
    );
  });

  // ── Rate Limiting ─────────────────────────────────────────────────────────

  it('when TOO_MANY_REQUESTS, then shows rate limit message with computed seconds', () => {
    const headers = new HttpHeaders({ 'Retry-After': '2' });
    const notifier = makeNotifier();
    const translate = makeTranslate((k, p) => {
      if (k === 'errors.rateLimit.tooManyRequests')
        return `wait ${p.seconds}`;
      if (k === 'errors.titles.warning') return 'Warning';
      return k;
    });

    handleError(
      new HttpErrorResponse({
        status: HTTP_STATUS.TOO_MANY_REQUESTS,
        headers,
      }) as any,
      translate,
      notifier,
      makeRouter(),
    );

    expect(notifier.show).toHaveBeenCalledWith(
      'warn',
      'wait 2',
      expect.objectContaining({
        summary: 'Warning',
        life: NOTIFICATION_CONFIG.RATE_LIMIT_LIFE_MS,
      }),
    );
  });

  // ── Server Errors ─────────────────────────────────────────────────────────

  it('when SERVICE_UNAVAILABLE, then shows toast and navigates to maintenance', () => {
    const notifier = makeNotifier();
    const router = makeRouter();

    handleError(
      new HttpErrorResponse({
        status: HTTP_STATUS.SERVICE_UNAVAILABLE,
      }) as any,
      makeTranslate(),
      notifier,
      router,
    );

    expect(notifier.show).toHaveBeenCalledWith(
      'error',
      'errors.server.serviceUnavailable',
      expect.any(Object),
    );
    expect(router.navigate).toHaveBeenCalled();
  });

  it('when 500 server error, then logs and shows internalError toast', () => {
    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    const notifier = makeNotifier();

    handleError(
      new HttpErrorResponse({ status: 500, message: 'boom' }) as any,
      makeTranslate(),
      notifier,
      makeRouter(),
    );

    expect(consoleSpy).toHaveBeenCalled();
    expect(notifier.show).toHaveBeenCalledWith(
      'error',
      'errors.server.internalError',
      expect.any(Object),
    );
    consoleSpy.mockRestore();
  });

  // ── Translation fallback ──────────────────────────────────────────────────

  it('when translate throws, then falls back to messageKey as text and "Error" as title', () => {
    const notifier = makeNotifier();
    const translate = makeTranslate(() => {
      throw new Error('i18n failure');
    });

    handleError(
      new HttpErrorResponse({ status: 500 }) as any,
      translate,
      notifier,
      makeRouter(),
    );

    expect(notifier.show).toHaveBeenCalledWith(
      'error',
      'errors.server.internalError',
      expect.objectContaining({
        summary: 'Error',
        life: NOTIFICATION_CONFIG.ERROR_LIFE_MS,
      }),
    );
  });
});