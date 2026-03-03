import { createSelector } from '@ngrx/store';
import { messagesFeature } from './messages.reducer';
import { messagesAdapter } from './messages.state';
import { chatFeature } from '../chat/chat.reducer';

/**
 * Unpack full entity-adapter selectors for the messages slice.
 */
const { selectAll: selectAllMessages } = messagesAdapter.getSelectors(
  messagesFeature.selectMessagesState,
);

/**
 * All messages belonging to the currently active conversation, ordered by
 * sentAt ascending (oldest → newest) for chronological rendering.
 */
export const selectActiveMessages = createSelector(
  selectAllMessages,
  chatFeature.selectActiveConversationId,
  (messages, activeId) =>
    messages
      .filter((m) => m.conversationId === activeId)
      .sort((a, b) => (a.sentAt?.getTime() ?? 0) - (b.sentAt?.getTime() ?? 0)),
);

/** Set of conversation IDs whose history has been fetched at least once. */
export const selectLoadedConversationIds =
  messagesFeature.selectLoadedConversationIds;

/** The conversation ID currently being loaded, or null when idle. */
export const selectLoadingConversationId =
  messagesFeature.selectLoadingConversationId;

/** True while any message page request is in flight. */
export const selectIsMessageLoading = createSelector(
  messagesFeature.selectLoadingConversationId,
  (id) => id !== null,
);
