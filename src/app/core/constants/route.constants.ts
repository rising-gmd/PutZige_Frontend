export const ROUTE_PATHS = {
  LOGIN: 'login',
  REGISTER: 'register',
  HOME: '',
  AUTH: 'auth',
  AUTH_LOGIN: 'auth/login',
  MAINTENANCE: 'maintenance',
};

export type RoutePath = keyof typeof ROUTE_PATHS;
