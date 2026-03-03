import { createSelector } from '@ngrx/store';
import { chatFeature } from './chat.reducer';
import { chatAdapter } from './chat.state';

/**
 * Unpack full entity-adapter selectors (selectAll, selectEntities, selectIds,
 * selectTotal) from the adapter. createFeature only generates property-level
 * selectors, so we need the adapter's getSelectors() for collection projections.
 */
const { selectAll, selectEntities } = chatAdapter.getSelectors(
  chatFeature.selectChatState,
);

/** All conversations as a flat array (unsorted). Use selectSortedConversations for UI lists. */
export const selectAllConversations = selectAll;

/** Dictionary of conversations keyed by conversationId. */
export const selectConversationEntities = selectEntities;

/** The fully hydrated Conversation entity that is currently open, or null. */
export const selectActiveConversation = createSelector(
  selectEntities,
  chatFeature.selectActiveConversationId,
  (entities, id) => (id ? (entities[id] ?? null) : null),
);

/**
 * Conversations sorted for the left-panel list:
 *   1. Pinned conversations first
 *   2. Then by lastActivity descending (most recent on top)
 */
export const selectSortedConversations = createSelector(selectAll, (convs) =>
  [...convs].sort((a, b) => {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
    return (
      new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
    );
  }),
);

/** Sum of all unread badge counts — drives the app-level notification indicator. */
export const selectTotalUnread = createSelector(selectAll, (convs) =>
  convs.reduce((sum, c) => sum + (c.unreadCount ?? 0), 0),
);
