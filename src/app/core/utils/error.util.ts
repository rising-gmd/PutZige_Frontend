/**
 * Safely extracts a human-readable error message from an unknown thrown value.
 *
 * Handles `Error` instances, plain strings, objects with a `message` property,
 * and falls back to `String()` coercion. Never throws.
 *
 * @param err - The caught error value (typically from a `catch` block).
 * @returns A non-empty error message string.
 */
export function extractErrorMessage(err: unknown): string {
  if (!err) return 'Unknown error';
  if (typeof err === 'string') return err;
  if (err instanceof Error) return err.message;
  if (typeof err === 'object' && err !== null) {
    const record = err as Record<string, unknown>;
    if (typeof record['message'] === 'string') return record['message'];
  }
  try {
    return String(err);
  } catch {
    return 'Unknown error';
  }
}
