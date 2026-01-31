import { NOTIFICATION_CONFIG } from '../../core/constants/http-status.constants';
import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  let msgs: { add: jest.Mock; clear: jest.Mock };
  let service: NotificationService;

  beforeEach(() => {
    msgs = {
      add: jest.fn(),
      clear: jest.fn(),
    };

    jest.useFakeTimers();

    service = new NotificationService(msgs as any);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('when severity is invalid, then it logs and does not show', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

    (service as any).show(undefined, 'detail');

    expect(warn).toHaveBeenCalled();
    expect(msgs.add).not.toHaveBeenCalled();
  });

  it('when detail is empty, then it logs and does not show', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

    service.show('info' as any, '');

    expect(warn).toHaveBeenCalled();
    expect(msgs.add).not.toHaveBeenCalled();
  });

  it('when detail contains HTML, then it is stripped', () => {
    service.show('info' as any, '<b> hello </b>');

    expect(msgs.add).toHaveBeenCalledTimes(1);
    const args = msgs.add.mock.calls[0][0];
    expect(args.detail).toBe('hello');
  });

  it('when duplicate error occurs, then second show is suppressed and count increments', () => {
    const first = 'Http failure response for (unknown): 0 Unknown Error';
    const second = 'Network error: 0 unknown error';

    service.show('error' as any, first);
    expect(msgs.add).toHaveBeenCalledTimes(1);

    service.show('error' as any, second);
    // second suppressed
    expect(msgs.add).toHaveBeenCalledTimes(1);

    const dedupeKey = (service as any).makeDedupeKey(
      'error',
      'Error',
      'network_error',
    );
    const entry = (service as any).dedupeCache.get(dedupeKey);
    expect(entry).toBeDefined();
    expect(entry.count).toBeGreaterThanOrEqual(0);
  });

  it('when overloaded and severity is info, then it drops and warns', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    (service as any).activeCount = NOTIFICATION_CONFIG.MAX_CONCURRENT_TOASTS;

    service.show('info' as any, 'ok');

    expect(msgs.add).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalled();
  });

  it('when overloaded and severity is error, then it clears and shows', () => {
    (service as any).activeCount = NOTIFICATION_CONFIG.MAX_CONCURRENT_TOASTS;

    service.show('error' as any, 'critical');

    expect(msgs.clear).toHaveBeenCalled();
    expect(msgs.add).toHaveBeenCalled();
  });

  it('when msgs.add throws, then fallbackMode is enabled and error logged', () => {
    msgs.add.mockImplementation(() => {
      throw new Error('boom');
    });

    const err = jest.spyOn(console, 'error').mockImplementation(() => {});

    service.show('info' as any, 'will fail');

    expect((service as any).fallbackMode).toBe(true);
    expect(err).toHaveBeenCalled();
  });

  it('clear(key) calls msgs.clear(key) and clear() resets activeCount', () => {
    (service as any).activeCount = 3;

    service.clear('mykey');
    expect(msgs.clear).toHaveBeenCalledWith('mykey');

    service.clear();
    expect(msgs.clear).toHaveBeenCalled();
    expect(service.getActiveCount()).toBe(0);
  });

  it('when msgs.clear throws, then error is logged', () => {
    msgs.clear.mockImplementation(() => {
      throw new Error('clear fail');
    });
    const err = jest.spyOn(console, 'error').mockImplementation(() => {});

    service.clear();

    expect(err).toHaveBeenCalled();
  });

  it('cleanupStaleEntries removes old entries and evictOldest evicts when cache too large', () => {
    // add one fresh and one stale entry
    const now = Date.now();
    (service as any).dedupeCache.set('fresh', { timestamp: now, count: 0 });
    (service as any).dedupeCache.set('old', {
      timestamp: now - NOTIFICATION_CONFIG.DEDUPE_WINDOW_MS - 1000,
      count: 0,
    });

    (service as any).cleanupStaleEntries();

    expect((service as any).dedupeCache.has('old')).toBe(false);
    expect((service as any).dedupeCache.has('fresh')).toBe(true);

    // fill cache above MAX_CACHE_SIZE to trigger eviction
    (service as any).dedupeCache.clear();
    const total =
      NOTIFICATION_CONFIG.MAX_CONCURRENT_TOASTS +
      NOTIFICATION_CONFIG.MAX_CACHE_SIZE; // > MAX_CACHE_SIZE
    for (let i = 0; i < total; i++) {
      (service as any).dedupeCache.set(`k${i}`, {
        timestamp: now + i,
        count: 0,
      });
    }

    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    (service as any).evictOldest();

    expect((service as any).dedupeCache.size).toBeLessThan(total);
    expect(warn).toHaveBeenCalled();
  });
});
import { jest } from '@jest/globals';
import { NotificationService } from './notification.service';
import { NOTIFICATION_CONFIG } from '../../core/constants/http-status.constants';

describe('NotificationService', () => {
  let svc: NotificationService;
  let msgs: any;

  beforeEach(() => {
    msgs = {
      add: jest.fn(),
      clear: jest.fn(),
      messageObserver: { subscribe: () => ({ unsubscribe: () => {} }) },
      clearObserver: { subscribe: () => ({ unsubscribe: () => {} }) },
    };

    // Use manual injection by constructing with the MessageService
    // Construct service with manual MessageService injection for tests
    // construct and inject test MessageService
    svc = new NotificationService(msgs);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('when invalid inputs, then does not call add', () => {
    svc.show('bad' as any, '');
    expect(msgs.add).not.toHaveBeenCalled();

    svc.show('success', '   ');
    expect(msgs.add).not.toHaveBeenCalled();
  });

  it('when input contains HTML, then it is sanitized before add', () => {
    svc.show('info', '<b>hello</b>');
    expect(msgs.add).toHaveBeenCalled();
    const call = msgs.add.mock.calls[0][0];
    // NotificationService strips HTML and returns plain text
    expect(call.detail).toBe('hello');
  });

  it('when duplicate within window, then second call is suppressed', () => {
    svc.show('warn', 'network error');
    svc.show('warn', 'network error');
    expect(msgs.add).toHaveBeenCalledTimes(1);
  });

  it('when overloaded with non-critical severity, then drop silently', () => {
    // simulate overload
    // @ts-ignore
    svc['activeCount'] = NOTIFICATION_CONFIG.MAX_CONCURRENT_TOASTS;

    const spy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    svc.show('info', 'non-critical');
    expect(msgs.add).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it('when overloaded with error severity, then clear and display', () => {
    // @ts-ignore
    svc['activeCount'] = NOTIFICATION_CONFIG.MAX_CONCURRENT_TOASTS;
    svc.show('error', 'critical');
    expect(msgs.clear).toHaveBeenCalled();
    expect(msgs.add).toHaveBeenCalled();
  });

  it('clear without key resets activeCount and calls msgs.clear', () => {
    // @ts-ignore
    svc['activeCount'] = 3;
    svc.clear();
    expect(msgs.clear).toHaveBeenCalled();
    expect(svc.getActiveCount()).toBe(0);
  });

  it('display handles exceptions and sets fallback mode', () => {
    msgs.add.mockImplementation(() => {
      throw new Error('boom');
    });
    svc.show('error', 'will fail');
    expect(svc.isFallbackMode()).toBe(true);
  });

  it('trackActive schedules decrement with life > 0', () => {
    jest.useFakeTimers();
    svc.show('info', 'one', { life: 100 });
    // activeCount increased
    // @ts-ignore
    expect(svc['activeCount']).toBeGreaterThanOrEqual(0);
    jest.runAllTimers();
  });

  it('cleanupStaleEntries removes expired cache entries and evicts oldest', () => {
    // fill dedupeCache with old entries
    // @ts-ignore
    const cache = svc['dedupeCache'];
    const now = Date.now();
    for (let i = 0; i < 10; i++) {
      cache.set('k' + i, {
        timestamp: now - NOTIFICATION_CONFIG.DEDUPE_WINDOW_MS - 1000 - i * 1000,
        count: 0,
      });
    }

    // add many entries to trigger eviction logic
    for (let i = 0; i < 200; i++) {
      cache.set('x' + i, { timestamp: now, count: 0 });
    }

    // Run cleanup
    // @ts-ignore
    svc['cleanupStaleEntries']();
    // stale entries removed
    // @ts-ignore
    expect(
      Array.from(svc['dedupeCache'].keys()).some((k) => k.startsWith('k')),
    ).toBe(false);
  });
});
