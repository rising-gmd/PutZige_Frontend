/**
 * Chat-feature constants.
 *
 * Kept separate from UI_CONSTANTS because these values are specific to the
 * chat domain and may need independent tuning (e.g. SEARCH_MIN_QUERY_LENGTH
 * depends on the backend's minimum indexed token length, not UI preference).
 */
export const CHAT_CONSTANTS = {
  /**
   * Minimum characters required before a search API call is dispatched.
   * Short queries produce noisy, low-quality results and add server load.
   * Must be kept in sync with the backend search index minimum token length.
   */
  SEARCH_MIN_QUERY_LENGTH: 2,

  /**
   * Prefix for client-generated temporary message IDs used by the optimistic
   * send flow. The reducer and effects use this prefix to identify placeholders
   * that have not yet been reconciled with a server-assigned ID.
   */
  TEMP_MESSAGE_ID_PREFIX: 'tmp_',
} as const;

export type ChatConstants = typeof CHAT_CONSTANTS;
