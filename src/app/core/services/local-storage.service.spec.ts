import { TestBed } from '@angular/core/testing';
import { LocalStorageService } from './local-storage.service';
import { APP_STORAGE } from '../tokens/storage.token';
import {
  STORAGE_ENCRYPTION_KEY,
  STORAGE_NAMESPACE,
} from '../tokens/storage-encryption.token';

class FakeStorage implements Storage {
  private map = new Map<string, string>();
  length = 0;
  clear(): void {
    this.map.clear();
    this.length = 0;
  }
  getItem(key: string): string | null {
    return this.map.get(key) ?? null;
  }
  key(index: number): string | null {
    return Array.from(this.map.keys())[index] ?? null;
  }
  removeItem(key: string): void {
    this.map.delete(key);
    this.length = this.map.size;
  }
  setItem(key: string, value: string): void {
    this.map.set(key, value);
    this.length = this.map.size;
  }
}

describe('LocalStorageService', () => {
  let svc: LocalStorageService;
  let storage: FakeStorage;

  beforeEach(() => {
    storage = new FakeStorage();
    TestBed.configureTestingModule({
      providers: [
        { provide: APP_STORAGE, useValue: storage },
        { provide: STORAGE_NAMESPACE, useValue: 'ns_' },
      ],
    });
    svc = TestBed.inject(LocalStorageService);
  });

  it('set and get roundtrip values', () => {
    svc.set('auth_token' as any, 'token123');
    expect(svc.get('auth_token' as any)).toBe('token123');
  });

  it('remove deletes value and emits change', () => {
    const spy = jest.fn();
    svc.changes$.subscribe(spy);
    svc.set('auth_token' as any, 'x');
    svc.remove('auth_token' as any);
    expect(svc.get('auth_token' as any)).toBeNull();
    expect(spy).toHaveBeenCalled();
  });

  it('has returns false for missing and true for present', () => {
    expect(svc.has('nope' as any)).toBe(false);
    svc.set('k' as any, { a: 1 });
    expect(svc.has('k' as any)).toBe(true);
  });

  it('ttl expiry causes value to be removed on get', () => {
    // freeze Date.now to simulate expiry
    const now = Date.now();
    const spyNow = jest.spyOn(Date, 'now').mockReturnValue(now);

    svc.set('t' as any, 'v', { ttl: 10 });
    // advance time beyond ttl
    spyNow.mockReturnValue(now + 1000);
    expect(svc.get('t' as any)).toBeNull();

    spyNow.mockRestore();
  });

  it('clear removes only namespaced keys', () => {
    // write a namespaced and non-namespaced key
    storage.setItem('ns_a', '1');
    storage.setItem('other_b', '2');
    svc.clear();
    expect(storage.getItem('ns_a')).toBeNull();
    expect(storage.getItem('other_b')).toBe('2');
  });

  it('setSecure/getSecure roundtrip when encryption key provided', () => {
    // reconfigure service with encryption key
    const key = 'secret-key-123';
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: APP_STORAGE, useValue: storage },
        { provide: STORAGE_ENCRYPTION_KEY, useValue: key },
        { provide: STORAGE_NAMESPACE, useValue: 'ns_' },
      ],
    });
    svc = TestBed.inject(LocalStorageService);

    svc.setSecure('s' as any, { a: 1 });
    const got = svc.getSecure('s' as any);
    expect(got).toEqual({ a: 1 });
  });

  it('getSecure returns null when no encryption key', () => {
    // ensure service without encryption key
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: APP_STORAGE, useValue: storage },
        { provide: STORAGE_NAMESPACE, useValue: 'ns_' },
      ],
    });
    svc = TestBed.inject(LocalStorageService);

    expect(svc.getSecure('s' as any)).toBeNull();
  });

  it('fallback to inMemory when storage.setItem throws', () => {
    const badStorage: any = {
      setItem: () => {
        throw new Error('fail');
      },
      getItem: () => {
        throw new Error('fail');
      },
      removeItem: () => {
        throw new Error('fail');
      },
      key: () => null,
      length: 0,
    };
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: APP_STORAGE, useValue: badStorage },
        { provide: STORAGE_NAMESPACE, useValue: 'ns_' },
      ],
    });
    svc = TestBed.inject(LocalStorageService);

    expect(() => svc.set('x' as any, 'v')).not.toThrow();
    expect(svc.get('x' as any)).toBe('v');
  });
});
