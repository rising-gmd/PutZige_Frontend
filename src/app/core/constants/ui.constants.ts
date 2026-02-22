export const UI_CONSTANTS = {
  MESSAGE_GROUP_THRESHOLD_MS: 2 * 60 * 1000, // 2 minutes
  TYPING_DEBOUNCE_MS: 2000,
  SEND_RESET_DELAY_MS: 400,
  SEARCH_DEBOUNCE_MS: 300,
  CONVERSATION_PAGE_SIZE: 50,
  VERIFY_REDIRECT_DELAY_MS: 3000,
  DEFAULT_TIMEZONE: 'UTC',
  SUPPORTED_TIMEZONES: [
    { label: 'UTC', value: 'UTC' },
    { label: 'Asia / Karachi', value: 'Asia/Karachi' },
    { label: 'Europe / Berlin', value: 'Europe/Berlin' },
    { label: 'Asia / Tokyo', value: 'Asia/Tokyo' },
    { label: 'Asia / Singapore', value: 'Asia/Singapore' },
    { label: 'America / New York', value: 'America/New_York' },
    { label: 'America / Los Angeles', value: 'America/Los_Angeles' },
  ] as const,
  DATE_FORMATS: {
    TIME: 'h:mm a',
    DAY_TIME: 'EEE h:mm a',
    MONTH_DAY: 'MMM d',
    MONTH_DAY_YEAR: 'MMM d, yyyy',
    FULL_TIMESTAMP: "MMMM d, yyyy 'at' h:mm a",
  } as const,
  DATE_LABELS: {
    YESTERDAY: 'Yesterday',
  } as const,
  DATE_THRESHOLDS: {
    WEEK_DAYS: 7,
    MS_PER_DAY: 1000 * 60 * 60 * 24,
    ZERO: 0,
    ONE: 1,
  } as const,
  EMPTY_STRING: '',
} as const;

export type UiConstants = typeof UI_CONSTANTS;
