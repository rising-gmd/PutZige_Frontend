export interface ApiResponse<T = unknown> {
  data?: T;
  success?: boolean;
  message?: string;
}
