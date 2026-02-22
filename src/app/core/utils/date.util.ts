import {
  formatDistanceToNow,
  parseISO,
  startOfDay,
  endOfDay,
  subDays,
  isWithinInterval,
  differenceInCalendarDays,
} from 'date-fns';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';
import { UI_CONSTANTS } from '../constants/ui.constants';
const {
  DEFAULT_TIMEZONE,
  DATE_FORMATS,
  DATE_LABELS,
  DATE_THRESHOLDS,
  EMPTY_STRING,
} = UI_CONSTANTS;

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

function isInDayForTimeZone(
  date: Date,
  timeZoneId: string,
  daysOffset: number = DATE_THRESHOLDS.ZERO,
): boolean {
  const zoned = toZonedTime(date, timeZoneId);
  const nowZoned = toZonedTime(new Date(), timeZoneId);
  const target =
    daysOffset === DATE_THRESHOLDS.ZERO
      ? nowZoned
      : subDays(nowZoned, Math.abs(daysOffset));
  const start = startOfDay(target);
  const end = endOfDay(target);
  return isWithinInterval(zoned, { start, end });
}

export function formatMessageTime(
  value: Date | string | undefined | null,
  timeZoneId: string = DEFAULT_TIMEZONE,
): string {
  const date = parseDate(value);
  if (!date) return EMPTY_STRING;

  if (isInDayForTimeZone(date, timeZoneId, DATE_THRESHOLDS.ZERO)) {
    return formatInTimeZone(date, timeZoneId, DATE_FORMATS.TIME);
  }
  if (isInDayForTimeZone(date, timeZoneId, DATE_THRESHOLDS.ONE)) {
    return DATE_LABELS.YESTERDAY;
  }
  const zonedNow = toZonedTime(new Date(), timeZoneId);
  const zonedDate = toZonedTime(date, timeZoneId);
  const diffDays = differenceInCalendarDays(zonedNow, zonedDate);
  if (diffDays < DATE_THRESHOLDS.WEEK_DAYS) {
    return formatInTimeZone(date, timeZoneId, DATE_FORMATS.DAY_TIME);
  }
  return formatInTimeZone(date, timeZoneId, DATE_FORMATS.MONTH_DAY);
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
  timeZoneId: string = DEFAULT_TIMEZONE,
): string {
  const date = parseDate(value);
  if (!date) return EMPTY_STRING;

  if (isInDayForTimeZone(date, timeZoneId, DATE_THRESHOLDS.ZERO)) {
    return formatInTimeZone(date, timeZoneId, DATE_FORMATS.TIME);
  }
  if (isInDayForTimeZone(date, timeZoneId, DATE_THRESHOLDS.ONE)) {
    return DATE_LABELS.YESTERDAY;
  }
  const zoned = toZonedTime(date, timeZoneId);
  const currentZoned = toZonedTime(new Date(), timeZoneId);
  const isThisYear = zoned.getFullYear() === currentZoned.getFullYear();
  return isThisYear
    ? formatInTimeZone(date, timeZoneId, DATE_FORMATS.MONTH_DAY)
    : formatInTimeZone(date, timeZoneId, DATE_FORMATS.MONTH_DAY_YEAR);
}

/**
 * Format relative time ("2 hours ago", "just now").
 * Used for tooltips and detailed views.
 */
export function formatRelativeTime(
  value: Date | string | undefined | null,
): string {
  const date = parseDate(value);
  if (!date) return EMPTY_STRING;
  // Relative time is independent of timezone for duration semantics; keep using UTC date
  return formatDistanceToNow(date, { addSuffix: true });
}

/**
 * Format full timestamp for detailed views.
 * "February 14, 2026 at 3:45 PM"
 */
export function formatFullTimestamp(
  value: Date | string | undefined | null,
  timeZoneId: string = DEFAULT_TIMEZONE,
): string {
  const date = parseDate(value);
  if (!date) return EMPTY_STRING;
  return formatInTimeZone(date, timeZoneId, DATE_FORMATS.FULL_TIMESTAMP);
}
export function formatDate(date: Date): string {
  return date.toISOString();
}
