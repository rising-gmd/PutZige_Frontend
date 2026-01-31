/*
  Skeleton tests for Error Handler Interceptor.
  These tests outline the required scenarios; implement using TestBed and HttpTestingController.
*/
import {
  handleError,
  shouldRetry,
  logErrorToMonitoring,
} from './error.interceptor';
import { RETRY_CONFIG } from '../constants/http-status.constants';
import { environment } from '../../../environments/environment';
import { HttpErrorResponse } from '@angular/common/http';

describe('ErrorHandlerInterceptor (implemented)', () => {
  const makeTranslate = () => ({ instant: jest.fn((k: string, p?: any) => k) });
  const makeNotifier = () => ({ show: jest.fn() });
  const makeRouter = () => ({ navigate: jest.fn(), url: '/current' as string });

  afterEach(() => {
    // restore online state
    try {
      Object.defineProperty(navigator, 'onLine', {
        value: true,
        configurable: true,
      });
    } catch (e) {
      void e;
    }
  });

  it('should show offline message when network is down', () => {
    const translate = makeTranslate();
    const notifier = makeNotifier();
    const router = makeRouter();

    Object.defineProperty(navigator, 'onLine', {
      value: false,
      configurable: true,
    });
    const err = new HttpErrorResponse({
      status: 0,
      statusText: 'Network error',
    });

    handleError(err, translate as any, notifier as any, router as any);

    expect(notifier.show).toHaveBeenCalled();
  });

  it('should redirect to login on 401 and clear token', () => {
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

  it('should indicate retry for 503 transient errors', () => {
    const err = new HttpErrorResponse({ status: 503 });
    expect(shouldRetry(err, 0)).toBe(true);
  });

  it('should NOT retry when retryCount >= MAX_RETRIES', () => {
    // use imported RETRY_CONFIG
    const err = new HttpErrorResponse({ status: 503 });
    expect(shouldRetry(err, RETRY_CONFIG.MAX_RETRIES)).toBe(false);
  });

  it('should NOT retry for non-HttpErrorResponse errors', () => {
    const err = new Error('boom');
    expect(shouldRetry(err, 0)).toBe(false);
  });

  it('should NOT show toast for validation errors with details', () => {
    const translate = makeTranslate();
    const notifier = makeNotifier();
    const router = makeRouter();

    const apiErr = { details: { field: 'bad' } } as any;
    const err = new HttpErrorResponse({ status: 422, error: apiErr as any });

    handleError(err, translate as any, notifier as any, router as any);

    expect(notifier.show).not.toHaveBeenCalled();
  });

  it('should show rate limit message with translated seconds', () => {
    const translate = makeTranslate();
    translate.instant = jest.fn().mockReturnValue('too many');
    const notifier = makeNotifier();
    const router = makeRouter();

    const err = new HttpErrorResponse({
      status: 429,
      headers: { get: () => '5' } as any,
    });

    handleError(err, translate as any, notifier as any, router as any);

    expect(notifier.show).toHaveBeenCalled();
  });

  it('logErrorToMonitoring prints console error in dev', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    // use imported logErrorToMonitoring
    const err = new HttpErrorResponse({ status: 500, message: 'boom' });

    // ensure environment is dev
    const orig = environment.production;
    environment.production = false;

    logErrorToMonitoring(err as any);
    expect(spy).toHaveBeenCalled();

    // restore
    environment.production = orig;
    spy.mockRestore();
  });

  it('logErrorToMonitoring does not print console error in production', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    // use imported logErrorToMonitoring
    const err = new HttpErrorResponse({ status: 500, message: 'boom' });

    const orig = environment.production;
    environment.production = true;

    logErrorToMonitoring(err as any);
    expect(spy).not.toHaveBeenCalled();

    environment.production = orig;
    spy.mockRestore();
  });
});
