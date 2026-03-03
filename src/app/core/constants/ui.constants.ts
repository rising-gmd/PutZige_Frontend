export const UI_CONSTANTS = {
  MESSAGE_GROUP_THRESHOLD_MS: 2 * 60 * 1000, // 2 minutes
  TYPING_DEBOUNCE_MS: 2000,
  /** Auto-clear typing indicator if server sends no StopTyping within this window. */
  TYPING_CLEAR_TIMEOUT_MS: 4_000,
  /** Show disconnect toast only after the hub has been gone this long (ms). */
  DISCONNECT_TOAST_DELAY_MS: 6_000,
  SEND_RESET_DELAY_MS: 400,
  SEARCH_DEBOUNCE_MS: 300,
  CONVERSATION_PAGE_SIZE: 50,
  VERIFY_REDIRECT_DELAY_MS: 3000,
  DEFAULT_TIMEZONE: 'UTC',
  SUPPORTED_TIMEZONES: Intl.supportedValuesOf('timeZone').map((tz) => ({
    label: tz.replace(/_/g, ' '),
    value: tz,
  })),
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
