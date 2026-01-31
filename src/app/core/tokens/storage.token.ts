import { InjectionToken } from '@angular/core';

// Injectable abstraction over window.localStorage to make the service testable and mockable.
// Provide this token in AppModule if you need to swap storage backend (e.g., sessionStorage or an in-memory mock).
export const APP_STORAGE = new InjectionToken<Storage | null>('app.storage', {
  providedIn: 'root',
  factory: () => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage;
      }
    } catch {
      // Accessing window.localStorage can throw in some environments (private mode)
    }
    return null;
  },
});
