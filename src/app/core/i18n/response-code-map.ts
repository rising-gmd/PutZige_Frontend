export const ResponseCodeToI18n: Record<string, string> = {
  // Success
  EMAIL_VERIFIED: 'auth.verify_email_active',
  LOGIN_SUCCESS: 'auth.login_success',
  REGISTRATION_SUCCESS: 'auth.register_success',
  EMAIL_VERIFICATION_SENT: 'auth.verify_email_verification_sent',

  // Auth errors
  INVALID_CREDENTIALS: 'auth.login_invalid_credentials',
  EMAIL_NOT_VERIFIED: 'auth.email_not_verified',
  ACCOUNT_LOCKED: 'auth.account_locked',
  TOKEN_EXPIRED: 'auth.verify_email_token_expired',
  TOKEN_INVALID: 'auth.verify_email_token_invalid',
  EMAIL_ALREADY_EXISTS: 'auth.register_email_exists',
  USERNAME_TAKEN: 'auth.register_username_taken',
  ACCOUNT_INACTIVE: 'auth.account_inactive',

  // Email verification
  EMAIL_ALREADY_VERIFIED: 'auth.verify_email_already_verified',
  TOO_MANY_RESEND_ATTEMPTS: 'auth.verify_email_too_many_attempts',

  // General
  NOT_FOUND: 'http.not_found',
  VALIDATION_FAILED: 'http.validation_failed',
  INTERNAL_SERVER_ERROR: 'http.internal_error',
  UNAUTHORIZED: 'auth.unauthorized',
  FORBIDDEN: 'auth.forbidden',

  // Field-specific validation codes
  EMAIL_REQUIRED: 'form.email_required',
  TOKEN_REQUIRED: 'form.token_required',
  IDENTIFIER_REQUIRED: 'form.identifier_required',
  PASSWORD_REQUIRED: 'form.password_required',
  REFRESH_TOKEN_REQUIRED: 'form.refresh_token_required',
  USERNAME_REQUIRED: 'form.username_required',
  PLAIN_TEXT_REQUIRED: 'system.plaintext_required',
  HASH_REQUIRED: 'system.hash_required',
  SALT_REQUIRED: 'system.salt_required',
  SENDER_ID_REQUIRED: 'messaging.sender_required',
  RECEIVER_ID_REQUIRED: 'messaging.receiver_required',
  MESSAGE_TEXT_REQUIRED: 'messaging.message_text_required',
  MESSAGE_TOO_LONG: 'messaging.message_too_long',
  MESSAGE_NOT_FOUND: 'messaging.message_not_found',
  PAGE_NUMBER_OUT_OF_RANGE: 'system.page_number_invalid',
  PAGE_SIZE_OUT_OF_RANGE: 'system.page_size_invalid',
  JWT_SECRET_NOT_CONFIGURED: 'system.jwt_secret_missing',
  JWT_SECRET_TOO_SHORT: 'system.jwt_secret_too_short',
};

export function mapResponseCode(code?: string): string {
  if (!code) return 'http.unknown';

  const raw = String(code).trim();
  if (!raw) return 'http.unknown';

  // Try normalized lookup using upper-cased response codes (backend constants are UPPER_SNAKE_CASE)
  const upper = raw.toUpperCase();
  const mapped = ResponseCodeToI18n[upper];
  if (mapped) return mapped;

  // No fallback prefix: return safe default key
  return 'http.unknown';
}
