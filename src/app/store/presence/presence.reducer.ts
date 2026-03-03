import { createFeature, createReducer, on } from '@ngrx/store';
import { initialPresenceState } from './presence.state';
import { PresenceActions } from './presence.actions';

export const presenceFeature = createFeature({
  name: 'presence',
  reducer: createReducer(
    initialPresenceState,

    on(PresenceActions.userCameOnline, (state, { userId }) => ({
      ...state,
      // Guard against duplicate entries from rapid reconnect events.
      onlineUserIds: state.onlineUserIds.includes(userId)
        ? state.onlineUserIds
        : [...state.onlineUserIds, userId],
    })),

    on(PresenceActions.userWentOffline, (state, { userId }) => ({
      ...state,
      onlineUserIds: state.onlineUserIds.filter((id) => id !== userId),
    })),

    on(
      PresenceActions.userStartedTyping,
      (state, { conversationId, userId }) => {
        const existing = state.typingMap[conversationId] ?? [];
        // Guard against duplicate typing events from rapid keystrokes.
        if (existing.includes(userId)) return state;
        return {
          ...state,
          typingMap: {
            ...state.typingMap,
            [conversationId]: [...existing, userId],
          },
        };
      },
    ),

    on(
      PresenceActions.userStoppedTyping,
      (state, { conversationId, userId }) => ({
        ...state,
        typingMap: {
          ...state.typingMap,
          [conversationId]: (state.typingMap[conversationId] ?? []).filter(
            (id) => id !== userId,
          ),
        },
      }),
    ),
  ),
});
