export const ROUTE_PATHS = {
  LOGIN: 'login',
  VERIFY_EMAIL: 'verify-email',
  REGISTER: 'register',
  HOME: '',
  AUTH: 'auth',
  AUTH_LOGIN: 'auth/login',
  MAINTENANCE: 'maintenance',
};

export type RoutePath = keyof typeof ROUTE_PATHS;
