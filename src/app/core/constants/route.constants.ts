export const ROUTE_PATHS = {
  LOGIN: 'login',
  REGISTER: 'register',
  HOME: '',
};

export type RoutePath = keyof typeof ROUTE_PATHS;
