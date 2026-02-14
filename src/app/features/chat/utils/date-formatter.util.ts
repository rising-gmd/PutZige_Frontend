import {
  formatMessageTime as coreFormatMessageTime,
  formatRelativeTime as coreFormatRelativeTime,
  formatConversationTime as coreFormatConversationTime,
  parseDate,
} from '../../../core/utils/date.util';

/**
 * Thin wrappers to keep existing chat utils API but delegate formatting to central date util.
 */
export function formatRelativeTime(date: Date | string): string {
  return coreFormatRelativeTime(date);
}

export function formatTime(date: Date | string): string {
  return coreFormatMessageTime(date);
}

export function getDateDivider(date: Date | string): string {
  // Use conversation time formatting for dividers; fall back to formatted message time.
  const parsed = parseDate(date);
  if (!parsed) return '';
  // If today/yesterday, return those labels
  const conv = coreFormatConversationTime(parsed);
  return conv;
}
