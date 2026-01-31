export const API_ENDPOINTS = {
  USERS: 'users',
  AUTH: 'auth',
  // add other endpoints here as needed
} as const;

export type ApiEndpoint = (typeof API_ENDPOINTS)[keyof typeof API_ENDPOINTS];
