import { Injectable, inject, isDevMode } from '@angular/core';
import { AES, enc } from 'crypto-js';
import { Subject } from 'rxjs';
import { STORAGE_KEYS, StorageKey } from '../constants/storage-keys.constants';
import { APP_STORAGE } from '../tokens/storage.token';
import {
  STORAGE_ENCRYPTION_KEY,
  STORAGE_NAMESPACE,
} from '../tokens/storage-encryption.token';

interface StoredPayload {
  value: unknown;
  expiresAt?: number | null;
}

@Injectable({ providedIn: 'root' })
export class LocalStorageService {
  private storage: Storage | null = inject(APP_STORAGE);
  private encryptionKey: string | null = (() => {
    try {
      return (
        (inject(STORAGE_ENCRYPTION_KEY, { optional: true }) as string) ?? null
      );
    } catch {
      return null;
    }
  })();

  private namespace =
    (() => {
      try {
        return (
          (inject(STORAGE_NAMESPACE, { optional: true }) as
            | string
            | undefined) ?? undefined
        );
      } catch {
        return undefined;
      }
    })() ?? '';

  // in-memory fallback when localStorage isn't available or fails
  private inMemory = new Map<string, string>();

  // change events for cross-tab or in-app watchers
  private changes = new Subject<{ key: StorageKey; value: unknown | null }>();

  public readonly changes$ = this.changes.asObservable();

  constructor() {
    // listen for cross-tab changes
    if (typeof window !== 'undefined' && 'addEventListener' in window) {
      try {
        window.addEventListener('storage', this.handleStorageEvent.bind(this));
      } catch {
        // ignore
      }
    }
  }

  // Public API -----------------------------------------------------------
  set<T>(key: StorageKey, value: T, options?: { ttl?: number }): void {
    const fullKey = this.fullKey(key);
    const payload: StoredPayload = {
      value: this.clone(value),
      expiresAt: options?.ttl ? Date.now() + options.ttl : undefined,
    };

    const serialized = this.serialize(payload);
    this.write(fullKey, serialized);
    this.changes.next({ key, value: this.clone(value) });
  }

  get<T>(key: StorageKey, defaultValue?: T): T | null {
    const fullKey = this.fullKey(key);
    const raw = this.read(fullKey);
    if (raw == null) return defaultValue ?? null;

    try {
      const payload = this.deserialize<StoredPayload>(raw);
      if (payload?.expiresAt && Date.now() > payload.expiresAt) {
        this.remove(key);
        return defaultValue ?? null;
      }
      return (this.clone(payload?.value) as T) ?? defaultValue ?? null;
    } catch (err) {
      this.devLog('Failed to parse stored value', err);
      return defaultValue ?? null;
    }
  }

  remove(key: StorageKey): void {
    const fullKey = this.fullKey(key);
    try {
      if (this.storage) {
        this.storage.removeItem(fullKey);
      }
    } catch (err) {
      this.inMemory.delete(fullKey);
      this.devLog('remove() failed, used in-memory fallback', err);
    }
    this.changes.next({ key, value: null });
  }

  clear(): void {
    // only clear keys that belong to our namespace to avoid touching other apps
    try {
      const prefix = this.namespace;
      if (this.storage) {
        const toRemove: string[] = [];
        for (let i = 0; i < this.storage.length; i++) {
          const k = this.storage.key(i);
          if (k && k.startsWith(prefix)) toRemove.push(k);
        }
        toRemove.forEach((k) => this.storage?.removeItem(k));
      } else {
        // in-memory fallback
        for (const k of Array.from(this.inMemory.keys())) {
          if (k.startsWith(prefix)) this.inMemory.delete(k);
        }
      }
    } catch (err) {
      this.devLog('clear() failed', err);
    }
  }

  has(key: StorageKey): boolean {
    const fullKey = this.fullKey(key);
    const raw = this.read(fullKey);
    if (raw == null) return false;
    try {
      const payload = this.deserialize<StoredPayload>(raw);
      if (payload?.expiresAt && Date.now() > payload.expiresAt) {
        this.remove(key);
        return false;
      }
      return payload?.value !== undefined && payload?.value !== null;
    } catch {
      return false;
    }
  }

  // Secure variants -----------------------------------------------------
  setSecure<T>(key: StorageKey, value: T, options?: { ttl?: number }): void {
    if (!this.encryptionKey) {
      this.devLog('Encryption key not provided; setSecure() aborted');
      return;
    }
    const fullKey = this.fullKey(key);
    const payload: StoredPayload = {
      value: this.clone(value),
      expiresAt: options?.ttl ? Date.now() + options.ttl : undefined,
    };
    const serialized = this.serialize(payload);
    try {
      const cipher = AES.encrypt(serialized, this.encryptionKey).toString();
      this.write(fullKey, cipher);
      this.changes.next({ key, value: this.clone(value) });
    } catch (err) {
      this.devLog('setSecure() failed', err);
    }
  }

  getSecure<T>(key: StorageKey, defaultValue?: T): T | null {
    if (!this.encryptionKey) {
      this.devLog('Encryption key not provided; getSecure() returning null');
      return defaultValue ?? null;
    }
    const fullKey = this.fullKey(key);
    const raw = this.read(fullKey);
    if (raw == null) return defaultValue ?? null;
    try {
      const bytes = AES.decrypt(raw, this.encryptionKey);
      const decrypted = bytes.toString(enc.Utf8);
      const payload = this.deserialize<StoredPayload>(decrypted);
      if (payload?.expiresAt && Date.now() > payload.expiresAt) {
        this.remove(key);
        return defaultValue ?? null;
      }
      return (this.clone(payload?.value) as T) ?? defaultValue ?? null;
    } catch (err) {
      this.devLog('getSecure() failed', err);
      return defaultValue ?? null;
    }
  }

  removeSecure(key: StorageKey): void {
    this.remove(key);
  }

  // Helpers -------------------------------------------------------------
  private fullKey(key: StorageKey): string {
    return `${this.namespace}${key}`;
  }

  private write(fullKey: string, serialized: string): void {
    try {
      if (this.storage) {
        this.storage.setItem(fullKey, serialized);
        return;
      }
    } catch (err) {
      this.devLog('write() failed, falling back to inMemory', err);
    }
    // fallback
    this.inMemory.set(fullKey, serialized);
  }

  private read(fullKey: string): string | null {
    try {
      if (this.storage) {
        const v = this.storage.getItem(fullKey);
        return v;
      }
    } catch (err) {
      this.devLog('read() failed, falling back to inMemory', err);
    }
    return this.inMemory.get(fullKey) ?? null;
  }

  private serialize(value: unknown): string {
    return JSON.stringify(value);
  }

  private deserialize<T>(raw: string): T {
    return JSON.parse(raw) as T;
  }

  private clone<T>(v: T): T {
    // structured clone via JSON for simple immutable copies (safe for most app data)
    try {
      return JSON.parse(JSON.stringify(v)) as T;
    } catch {
      return v;
    }
  }

  private handleStorageEvent(e: StorageEvent): void {
    try {
      if (!e.key) return;
      const key = e.key.replace(this.namespace, '') as StorageKey;
      if (!Object.values(STORAGE_KEYS).includes(key as StorageKey)) return;
      // if removed
      if (e.newValue === null) {
        this.changes.next({ key, value: null });
        return;
      }
      // Try to parse (if encrypted we can't know here)
      try {
        const payload = this.deserialize<StoredPayload>(e.newValue!);
        this.changes.next({ key, value: payload?.value ?? null });
      } catch {
        // Could be encrypted; emit null to signal change
        this.changes.next({ key, value: null });
      }
    } catch {
      // ignore
    }
  }

  private devLog(...args: unknown[]) {
    if (isDevMode()) console.error('[LocalStorageService]', ...args);
  }
}
