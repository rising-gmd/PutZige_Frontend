export interface ApiResponse<T = unknown> {
  success?: boolean;
  data?: T;
  message?: string;
  responseCode?: string;
  metadata?: Record<string, unknown>;
  errors?: Record<string, string[]>;
  statusCode?: number;
  timestamp?: string;
}
