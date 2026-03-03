import { createSelector } from '@ngrx/store';
import { presenceFeature } from './presence.reducer';

/** IDs of users who are currently online. */
export const selectOnlineUserIds = presenceFeature.selectOnlineUserIds;

/**
 * Factory selector: returns true if the given userId is online.
 * Usage: store.select(selectIsUserOnline(userId))
 */
export const selectIsUserOnline = (userId: string) =>
  createSelector(presenceFeature.selectOnlineUserIds, (ids) =>
    ids.includes(userId),
  );

/**
 * All user IDs currently typing in a specific conversation.
 * Usage: store.select(selectTypingUsersInConversation(conversationId))
 */
export const selectTypingUsersInConversation = (conversationId: string) =>
  createSelector(
    presenceFeature.selectTypingMap,
    (typingMap) => typingMap[conversationId] ?? [],
  );

/** True if at least one other user is typing in the given conversation. */
export const selectIsAnyoneTyping = (conversationId: string) =>
  createSelector(
    presenceFeature.selectTypingMap,
    (typingMap) => (typingMap[conversationId]?.length ?? 0) > 0,
  );
