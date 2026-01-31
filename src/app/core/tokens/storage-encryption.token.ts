import { InjectionToken } from '@angular/core';

// Injection token for the AES encryption key used by LocalStorageService.
// Provide this token in AppModule or a feature module using a secure source (environment, session, or runtime config).
export const STORAGE_ENCRYPTION_KEY = new InjectionToken<string>(
  'storage.encryption.key',
);

// Optional namespace prefix to scope keys and avoid collisions. Default should be provided by app if different.
export const STORAGE_NAMESPACE = new InjectionToken<string>(
  'storage.namespace',
);
