# Local Storage Service — Usage & Migration Guide

## Summary

- `LocalStorageService` provides a type-safe, encrypted (optional) wrapper around `localStorage` with TTL, in-memory fallback, and cross-tab sync.

## Installation

Install the encryption library as required:

```bash
npm install crypto-js
npm install --save-dev @types/crypto-js
```

Configure the encryption key in your AppModule (recommended):

```ts
import { NgModule } from "@angular/core";
import { STORAGE_ENCRYPTION_KEY, STORAGE_NAMESPACE } from "./core/tokens/storage-encryption.token";

@NgModule({
  providers: [
    { provide: STORAGE_ENCRYPTION_KEY, useValue: environment.storageEncryptionKey },
    { provide: STORAGE_NAMESPACE, useValue: "app_" },
  ],
})
export class AppModule {}
```

## Key Management

- Do NOT hardcode the key in the service. Provide via `STORAGE_ENCRYPTION_KEY` InjectionToken from environment or runtime config.
- For maximum security, derive or fetch the key from a secure authenticated endpoint or session store.

## Basic Examples

- Import keys and service:

```ts
import { STORAGE_KEYS } from '../core/constants/storage-keys.constants';
import { LocalStorageService } from '../core/services/local-storage.service';

constructor(private storage: LocalStorageService) {}
```

- Store non-sensitive data:

```ts
storage.set(STORAGE_KEYS.USER_PREFERENCES, { theme: "dark", sidebar: true });
const prefs = storage.get<typeof defaultPrefs>(STORAGE_KEYS.USER_PREFERENCES);
```

- Secure storage (auth tokens, PII):

```ts
storage.setSecure(STORAGE_KEYS.AUTH_TOKEN, token);
const token = storage.getSecure<string>(STORAGE_KEYS.AUTH_TOKEN);
```

- TTL caching:

```ts
storage.set(STORAGE_KEYS.CACHE_PREFIX + "countries", countries, { ttl: 60_000 });
```

- Cross-tab sync / watch changes:

```ts
storage.changes$.subscribe(({ key, value }) => {
  if (key === STORAGE_KEYS.THEME) {
    /* react to changes */
  }
});
```

## Migration Guide

If your codebase currently calls `localStorage` directly, refactor in-place with the following steps:

1. Add an import for `STORAGE_KEYS` and `LocalStorageService`.
2. Replace `localStorage.setItem('myKey', JSON.stringify(obj))` with `storage.set(STORAGE_KEYS.MY_KEY, obj)`.
3. Replace `JSON.parse(localStorage.getItem('myKey') || 'null')` with `storage.get(STORAGE_KEYS.MY_KEY)`.
4. For tokens or PII, replace `localStorage` usage with `setSecure()` / `getSecure()`.
5. Remove any hardcoded string keys and add them to `storage-keys.constants.ts`.

Example refactor:

```diff
  - localStorage.setItem('token', token);
  + storage.setSecure(STORAGE_KEYS.AUTH_TOKEN, token);

  - const user = JSON.parse(localStorage.getItem('user') || 'null');
  + const user = storage.get<UserProfile>(STORAGE_KEYS.USER_PROFILE);
```

## Security Notes

- Encryption reduces the risk of casual inspection, but it does NOT mitigate XSS. Never trust client-side storage for critical secrets.
- Prefer `sessionStorage` or in-memory storage for ultra-sensitive session keys when possible.

## Error Handling

- The service will never throw on storage errors. It falls back to in-memory storage and logs errors only in development mode.
