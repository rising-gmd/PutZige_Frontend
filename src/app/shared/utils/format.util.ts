/**
 * format.util.ts
 * Pure formatting utilities shared across the application.
 * No Angular DI — importable anywhere including tests without TestBed.
 */

/**
 * Converts raw seconds to MM:SS display format.
 * Used for audio and video duration stamps in message bubbles.
 *
 * @example formatDuration(90)  // '01:30'
 */
export function formatDuration(secs: number): string {
  const m = Math.floor(secs / 60)
    .toString()
    .padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

/**
 * Converts byte count to a human-readable size string.
 * Precision kept to 1 decimal to avoid noisy labels in tight UI.
 *
 * @example formatSize(1536)   // '1.5 KB'
 * @example formatSize(2097152) // '2.0 MB'
 */
export function formatSize(bytes: number): string {
  if (bytes < 1_024) return `${bytes} B`;
  if (bytes < 1_048_576) return `${(bytes / 1_024).toFixed(1)} KB`;
  return `${(bytes / 1_048_576).toFixed(1)} MB`;
}
