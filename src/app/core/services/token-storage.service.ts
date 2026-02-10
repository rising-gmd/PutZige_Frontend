import { Injectable } from '@angular/core';

/**
 * Token storage service - Google/Microsoft style
 * Uses in-memory storage with sessionStorage fallback
 * No encryption (relies on HTTPS, CSP, XSS prevention)
 */
@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  private readonly tokenCache = new Map<string, string>();
  private readonly useSessionStorage = true; // Change to false for memory-only

  setToken(key: string, value: string): void {
    this.tokenCache.set(key, value);
    if (this.useSessionStorage) {
      try {
        sessionStorage.setItem(key, value);
      } catch {
        // Quota exceeded or disabled
      }
    }
  }

  getToken(key: string): string | null {
    // Try memory first
    const cached = this.tokenCache.get(key);
    if (cached) return cached;

    // Fallback to sessionStorage
    if (this.useSessionStorage) {
      try {
        const stored = sessionStorage.getItem(key);
        if (stored) {
          this.tokenCache.set(key, stored); // Warm cache
          return stored;
        }
      } catch {
        // Storage disabled
      }
    }

    return null;
  }

  removeToken(key: string): void {
    this.tokenCache.delete(key);
    if (this.useSessionStorage) {
      try {
        sessionStorage.removeItem(key);
      } catch {
        // Storage disabled
      }
    }
  }

  clear(): void {
    this.tokenCache.clear();
    if (this.useSessionStorage) {
      try {
        sessionStorage.clear();
      } catch {
        // Storage disabled
      }
    }
  }
}
