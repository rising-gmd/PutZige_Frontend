import {
  formatDistanceToNow,
  format,
  isToday,
  isYesterday,
  parseISO,
} from 'date-fns';

/**
 * Centralized date formatting utilities for chat application.
 * All date handling MUST use these functions for consistency.
 */

/**
 * Parse ISO string or Date to Date object safely.
 */
export function parseDate(value: unknown): Date | null {
  if (value == null) return null;
  if (value instanceof Date) return value;
  try {
    if (typeof value === 'string') return parseISO(value);
    // For numbers or other primitives, coerce to string then Date.
    return new Date(String(value));
  } catch {
    return null;
  }
}

/**
 * Format message timestamp for message list.
 * Today: "3:45 PM"
 * This week: "Mon 3:45 PM"
 * Older: "Jan 15"
 */
export function formatMessageTime(
  value: Date | string | undefined | null,
): string {
  const date = parseDate(value);
  if (!date) return '';

  if (isToday(date)) {
    return format(date, 'h:mm a');
  }
  if (isYesterday(date)) {
    return 'Yesterday';
  }
  const daysDiff = Math.floor(
    (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (daysDiff < 7) {
    return format(date, 'EEE h:mm a');
  }
  return format(date, 'MMM d');
}

/**
 * Format conversation list timestamp.
 * Today: "3:45 PM"
 * Yesterday: "Yesterday"
 * This year: "Jan 15"
 * Older: "Jan 15, 2025"
 */
export function formatConversationTime(
  value: Date | string | undefined | null,
): string {
  const date = parseDate(value);
  if (!date) return '';

  if (isToday(date)) {
    return format(date, 'h:mm a');
  }
  if (isYesterday(date)) {
    return 'Yesterday';
  }
  const isThisYear = date.getFullYear() === new Date().getFullYear();
  return isThisYear ? format(date, 'MMM d') : format(date, 'MMM d, yyyy');
}

/**
 * Format relative time ("2 hours ago", "just now").
 * Used for tooltips and detailed views.
 */
export function formatRelativeTime(
  value: Date | string | undefined | null,
): string {
  const date = parseDate(value);
  if (!date) return '';
  return formatDistanceToNow(date, { addSuffix: true });
}

/**
 * Format full timestamp for detailed views.
 * "February 14, 2026 at 3:45 PM"
 */
export function formatFullTimestamp(
  value: Date | string | undefined | null,
): string {
  const date = parseDate(value);
  if (!date) return '';
  return format(date, "MMMM d, yyyy 'at' h:mm a");
}
export function formatDate(date: Date): string {
  return date.toISOString();
}
