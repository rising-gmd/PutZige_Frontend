export const STORAGE_KEYS = {
  // Authentication
  AUTH_TOKEN: 'app_auth_token',
  REFRESH_TOKEN: 'app_refresh_token',

  // User data
  USER_PROFILE: 'app_user_profile',
  USER_PREFERENCES: 'app_user_preferences',

  // App settings
  THEME: 'app_theme',
  LANGUAGE: 'app_language',

  // Cache & session
  CACHE_PREFIX: 'app_cache_',
  SESSION_DATA: 'app_session_data',
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];
