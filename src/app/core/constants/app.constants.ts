export const APP_NAME = 'PutZige';

/**
 * NgRx Store Devtools configuration.
 * `MAX_AGE` governs how many actions are retained in the devtools history.
 * A higher value aids debugging but increases memory usage in long sessions.
 */
export const NGRX_DEVTOOLS_CONFIG = {
  MAX_AGE: 25,
} as const;

// NOTE: Base URL is provided via `API_CONFIG` DI token and applied by the HTTP interceptor.
// Do not use `API_BASE_URL` directly in services — it was removed per new convention.
