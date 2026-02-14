import {
  parseDate,
  formatMessageTime,
  formatConversationTime,
  formatRelativeTime,
  formatFullTimestamp,
} from './date.util';

describe('date.util', () => {
  beforeAll(() => {
    // freeze time to a known value for deterministic relative outputs
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-02-14T15:45:00'));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  test('parseDate handles Date and ISO string and invalid', () => {
    const d = new Date('2026-02-14T15:45:00');
    expect(parseDate(d)).toBeInstanceOf(Date);
    expect(parseDate('2026-02-14T15:45:00')).toBeInstanceOf(Date);
    expect(parseDate(undefined)).toBeNull();
    expect(parseDate(null)).toBeNull();
  });

  test('formatMessageTime: today, yesterday, weekday, older', () => {
    const today = new Date('2026-02-14T09:30:00');
    const yesterday = new Date('2026-02-13T10:00:00');
    const thisWeek = new Date('2026-02-12T11:15:00');
    const older = new Date('2025-12-01T08:00:00');

    expect(formatMessageTime(today)).toMatch(/\d{1,2}:\d{2} [AP]M/i);
    expect(formatMessageTime(yesterday)).toBe('Yesterday');
    expect(formatMessageTime(thisWeek)).toMatch(/[A-Za-z]{3} \d{1,2}:\d{2}/);
    expect(formatMessageTime(older)).toMatch(/[A-Za-z]{3} \d{1,2}/);
  });

  test('formatConversationTime: today, yesterday, this year, older year', () => {
    const today = new Date('2026-02-14T09:30:00');
    const yesterday = new Date('2026-02-13T10:00:00');
    const thisYear = new Date('2026-01-15T12:00:00');
    const olderYear = new Date('2025-01-15T12:00:00');

    expect(formatConversationTime(today)).toMatch(/\d{1,2}:\d{2} [AP]M/i);
    expect(formatConversationTime(yesterday)).toBe('Yesterday');
    expect(formatConversationTime(thisYear)).toMatch(/[A-Za-z]{3} \d{1,2}/);
    expect(formatConversationTime(olderYear)).toMatch(
      /[A-Za-z]{3} \d{1,2}, \d{4}/,
    );
  });

  test('formatRelativeTime returns an "ago" string for past dates', () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const rel = formatRelativeTime(twoHoursAgo);
    expect(typeof rel).toBe('string');
    expect(rel.toLowerCase()).toContain('ago');
  });

  test('formatFullTimestamp returns a human readable string containing month, year and "at"', () => {
    const d = new Date('2026-02-14T15:45:00');
    const s = formatFullTimestamp(d);
    expect(s).toContain('February');
    expect(s).toContain('2026');
    expect(s).toContain('at');
  });
});
import { formatDate } from './date.util';

describe('date.util', () => {
  it('formats date to ISO string', () => {
    const d = new Date('2020-01-01T00:00:00.000Z');
    expect(formatDate(d)).toBe(d.toISOString());
  });
});
