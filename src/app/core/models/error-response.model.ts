export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
  statusCode?: number;
  timestamp?: string;
}

export interface GenericErrorResponse {
  error?: string;
  message?: string;
  msg?: string;
  [key: string]: unknown;
}
