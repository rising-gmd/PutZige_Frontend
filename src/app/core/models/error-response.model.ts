export interface ApiErrorResponse {
  message: string;
  code?: string;
  details?: Record<string, string[]>;
  timestamp?: string;
}

export interface GenericErrorResponse {
  error?: string;
  message?: string;
  msg?: string;
  [key: string]: unknown;
}
