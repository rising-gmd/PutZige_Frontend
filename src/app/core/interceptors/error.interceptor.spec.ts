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

describe('error.interceptor utilities', () => {
  describe('shouldRetry()', () => {
    it('when retryCount >= MAX_RETRIES, then returns false', () => {
      expect(
        shouldRetry(
          new HttpErrorResponse({ status: 0 }),
          RETRY_CONFIG.MAX_RETRIES,
        ),
      ).toBe(false);
    });

    it('when error is HttpErrorResponse with NETWORK_ERROR, then returns true', () => {
      const err = new HttpErrorResponse({ status: HTTP_STATUS.NETWORK_ERROR });
      expect(shouldRetry(err, 0)).toBe(true);
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

      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });
  });

  describe('handleError() integration paths', () => {
    const makeTranslate = (impl: (key: string, params?: any) => string) =>
      ({ instant: impl }) as any;
    const makeNotifier = () => ({ show: jest.fn() }) as any;
    const makeRouter = () => ({ navigate: jest.fn(), url: '/current' }) as any;

    it('when TOO_MANY_REQUESTS, then shows rate limit message with computed seconds', () => {
      const headers = new HttpHeaders({ 'Retry-After': '2' });
      const resp = new HttpErrorResponse({
        status: HTTP_STATUS.TOO_MANY_REQUESTS,
        headers,
      });

      const translate = makeTranslate((k, p) => {
        if (k === 'errors.rateLimit.tooManyRequests')
          return `wait ${p.seconds}`;
        if (k === 'errors.titles.warning') return 'Warning';
        return k;
      });
      const notifier = makeNotifier();
      const router = makeRouter();

      handleError(resp as any, translate, notifier, router);

      expect(notifier.show).toHaveBeenCalledWith(
        'warn',
        'wait 2',
        expect.objectContaining({
          summary: 'Warning',
          life: NOTIFICATION_CONFIG.RATE_LIMIT_LIFE_MS,
        }),
      );
    });

    it('when server error and translate throws, then falls back to messageKey and Error title', () => {
      const resp = new HttpErrorResponse({
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        statusText: 'oops',
      });

      const translate = makeTranslate(() => {
        throw new Error('x');
      });
      const notifier = makeNotifier();
      const router = makeRouter();

      handleError(resp as any, translate, notifier, router);

      expect(notifier.show).toHaveBeenCalledWith(
        'error',
        'errors.server.internalError',
        expect.objectContaining({
          summary: 'Error',
          life: NOTIFICATION_CONFIG.ERROR_LIFE_MS,
        }),
      );
    });

    it('when TimeoutError name present, then shows timeout toast', () => {
      const resp = { name: 'TimeoutError' } as any;
      const translate = makeTranslate((k) => k);
      const notifier = makeNotifier();
      const router = makeRouter();

      handleError(resp, translate, notifier, router);

      expect(notifier.show).toHaveBeenCalled();
    });

    it('when offline, then shows offline toast', () => {
      const resp = new HttpErrorResponse({ status: 0, message: 'fail' });
      const translate = makeTranslate((k) => k);
      const notifier = makeNotifier();
      const router = makeRouter();

      // simulate offline via property override
      // @ts-ignore
      const origDescriptor = Object.getOwnPropertyDescriptor(
        navigator,
        'onLine',
      );
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        configurable: true,
      });

      handleError(resp as any, translate, notifier, router);

      expect(notifier.show).toHaveBeenCalled();

      // restore
      if (origDescriptor)
        Object.defineProperty(
          navigator,
          'onLine',
          origDescriptor as PropertyDescriptor,
        );
    });

    it('when CORS-like message, then shows cors toast with detail', () => {
      const resp = new HttpErrorResponse({
        status: 0,
        message: 'Failed to fetch',
      });
      const translate = makeTranslate((k) => k);
      const notifier = makeNotifier();
      const router = makeRouter();

      // ensure online via property override so branch reaches CORS detection
      // @ts-ignore
      const origDescriptor2 = Object.getOwnPropertyDescriptor(
        navigator,
        'onLine',
      );
      Object.defineProperty(navigator, 'onLine', {
        value: true,
        configurable: true,
      });

      handleError(resp as any, translate, notifier, router);

      expect(notifier.show).toHaveBeenCalled();

      // restore
      if (origDescriptor2)
        Object.defineProperty(
          navigator,
          'onLine',
          origDescriptor2 as PropertyDescriptor,
        );
    });

    it('when UNAUTHORIZED, then clears token and navigates after delay', () => {
      jest.useFakeTimers();
      const resp = new HttpErrorResponse({ status: HTTP_STATUS.UNAUTHORIZED });
      const translate = makeTranslate((k) => k);
      const notifier = makeNotifier();
      const router = makeRouter();

      const removeSpy = jest.spyOn(Storage.prototype, 'removeItem');

      handleError(resp as any, translate, notifier, router);

      // should have attempted to remove token
      expect(removeSpy).toHaveBeenCalled();

      // advance timers to fire redirect
      jest.advanceTimersByTime(REQUEST_CONFIG.AUTH_REDIRECT_DELAY_MS + 10);
      expect(router.navigate).toHaveBeenCalled();

      removeSpy.mockRestore();
      jest.useRealTimers();
    });

    it('when BAD_REQUEST with details, then returns without notifying', () => {
      const apiError = { details: { foo: 'bar' } } as any;
      const resp = new HttpErrorResponse({
        status: HTTP_STATUS.BAD_REQUEST,
        error: apiError,
      });
      const translate = makeTranslate((k) => k);
      const notifier = makeNotifier();
      const router = makeRouter();

      handleError(resp as any, translate, notifier, router);

      expect(notifier.show).not.toHaveBeenCalled();
    });

    it('when FORBIDDEN or NOT_FOUND, then shows appropriate toasts', () => {
      const translate = makeTranslate((k) => k);
      const notifier = makeNotifier();
      const router = makeRouter();

      handleError(
        new HttpErrorResponse({ status: HTTP_STATUS.FORBIDDEN }) as any,
        translate,
        notifier,
        router,
      );
      expect(notifier.show).toHaveBeenCalled();

      notifier.show.mockClear();
      handleError(
        new HttpErrorResponse({ status: HTTP_STATUS.NOT_FOUND }) as any,
        translate,
        notifier,
        router,
      );
      expect(notifier.show).toHaveBeenCalled();
    });

    it('when SERVICE_UNAVAILABLE, then shows and navigates to maintenance', () => {
      const translate = makeTranslate((k) => k);
      const notifier = makeNotifier();
      const router = makeRouter();

      handleError(
        new HttpErrorResponse({
          status: HTTP_STATUS.SERVICE_UNAVAILABLE,
        }) as any,
        translate,
        notifier,
        router,
      );

      expect(notifier.show).toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalledWith(['maintenance']);
    });
  });
});
import { handleError, shouldRetry } from './error.interceptor';
import { HttpErrorResponse } from '@angular/common/http';

describe('error.interceptor helpers', () => {
  const makeTranslate = () => ({ instant: jest.fn((k: string) => k) });
  const makeNotifier = () => ({ show: jest.fn() });
  const makeRouter = () => ({ navigate: jest.fn(), url: '/current' as string });

  beforeEach(() => {
    jest.useRealTimers();
  });

  it('shouldRetry returns true for network error status 0', () => {
    const err = new HttpErrorResponse({ status: 0 });
    expect(shouldRetry(err, 0)).toBe(true);
  });

  it('shouldRetry returns true for configured retry status', () => {
    const err = new HttpErrorResponse({ status: 429 });
    expect(shouldRetry(err, 0)).toBe(true);
  });

  it('when timeout error, then shows timeout toast', () => {
    const translate = makeTranslate();
    const notifier = makeNotifier();
    const router = makeRouter();
    const error = { name: 'TimeoutError' } as unknown as HttpErrorResponse;

    handleError(error, translate as any, notifier as any, router as any);

    expect(notifier.show).toHaveBeenCalled();
  });

  it('when offline network error, then shows offline message', () => {
    const translate = makeTranslate();
    const notifier = makeNotifier();
    const router = makeRouter();
    Object.defineProperty(navigator, 'onLine', {
      value: false,
      configurable: true,
    });
    const err = new HttpErrorResponse({
      status: 0,
      statusText: 'fail',
      error: 'fail',
    });

    handleError(err, translate as any, notifier as any, router as any);

    expect(notifier.show).toHaveBeenCalled();
    Object.defineProperty(navigator, 'onLine', {
      value: true,
      configurable: true,
    });
  });

  it('when CORS-like message, then shows cors message', () => {
    const translate = makeTranslate();
    const notifier = makeNotifier();
    const router = makeRouter();
    const err = new HttpErrorResponse({
      status: 0,
      statusText: 'CORS missing allow origin',
      error: 'CORS missing allow origin',
    });

    handleError(err, translate as any, notifier as any, router as any);

    expect(notifier.show).toHaveBeenCalled();
  });

  it('when unauthorized, clears token, shows toast and navigates after delay', () => {
    jest.useFakeTimers();
    const translate = makeTranslate();
    const notifier = makeNotifier();
    const router = makeRouter();
    const removeSpy = jest.spyOn(Storage.prototype, 'removeItem');

    const err = new HttpErrorResponse({ status: 401 });
    handleError(err, translate as any, notifier as any, router as any);

    expect(removeSpy).toHaveBeenCalled();
    expect(notifier.show).toHaveBeenCalled();

    jest.runAllTimers();
    expect(router.navigate).toHaveBeenCalled();
    removeSpy.mockRestore();
    jest.useRealTimers();
  });

  it('when too many requests, then shows rate limit with translated seconds', () => {
    const translate = makeTranslate();
    translate.instant = jest.fn().mockReturnValue('too many');
    const notifier = makeNotifier();
    const router = makeRouter();
    const err = new HttpErrorResponse({
      status: 429,
      error: {} as any,
      headers: { get: () => '3' } as any,
    });

    handleError(err, translate as any, notifier as any, router as any);

    expect(notifier.show).toHaveBeenCalled();
  });

  it('when server error, then logs and shows internal error', () => {
    const translate = makeTranslate();
    const notifier = makeNotifier();
    const router = makeRouter();
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const err = new HttpErrorResponse({ status: 500, message: 'boom' });

    handleError(err, translate as any, notifier as any, router as any);

    expect(notifier.show).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('when validation details present, then does not show toast', () => {
    const translate = makeTranslate();
    const notifier = makeNotifier();
    const router = makeRouter();
    const apiErr = { details: { field: 'bad' } } as any;
    const err = new HttpErrorResponse({ status: 400, error: apiErr as any });

    handleError(err, translate as any, notifier as any, router as any);

    expect(notifier.show).not.toHaveBeenCalled();
  });
});
import * as mod from './error.interceptor';

describe('error.interceptor', () => {
  it('module loads', () => {
    expect(mod).toBeDefined();
  });
});
