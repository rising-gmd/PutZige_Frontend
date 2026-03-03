import { createFeature, createReducer, on } from '@ngrx/store';
import { chatAdapter, initialChatState } from './chat.state';
import {
  ChatActions,
  ChatApiActions,
  ChatWebSocketActions,
} from './chat.actions';
import {
  MessageWebSocketActions,
  MessageApiActions,
} from '../messages/messages.actions';
import { PresenceActions } from '../presence/presence.actions';

export const chatFeature = createFeature({
  name: 'chat',
  reducer: createReducer(
    initialChatState,

    // ── Page lifecycle ──────────────────────────────────────────────────────

    on(ChatActions.pageOpened, (state) => ({
      ...state,
      loadingStatus: 'loading' as const,
      error: null,
    })),

    // ── Current user ────────────────────────────────────────────────────────

    on(ChatApiActions.currentUserLoadSuccess, (state, { user }) => ({
      ...state,
      currentUser: user,
    })),

    on(ChatApiActions.currentUserLoadFailure, (state, { error }) => ({
      ...state,
      loadingStatus: 'error' as const,
      error,
    })),

    // ── Conversations ────────────────────────────────────────────────────────

    on(ChatApiActions.conversationsLoadSuccess, (state, { conversations }) =>
      chatAdapter.setAll(conversations, {
        ...state,
        loadingStatus: 'loaded' as const,
        error: null,
      }),
    ),

    on(ChatApiActions.conversationsLoadFailure, (state, { error }) => ({
      ...state,
      loadingStatus: 'error' as const,
      error,
    })),

    on(ChatApiActions.createConversationSuccess, (state, { conversation }) =>
      chatAdapter.addOne(conversation, state),
    ),

    // ── Conversation selection ───────────────────────────────────────────────

    on(ChatActions.conversationSelected, (state, { conversationId }) => ({
      ...state,
      activeConversationId: conversationId,
    })),

    // ── WebSocket: new conversation pushed by server ─────────────────────────

    on(ChatWebSocketActions.conversationReceived, (state, { conversation }) => {
      const existing = state.entities[conversation.conversationId];
      if (existing) {
        // Merge: prefer server values but keep local UI flags
        return chatAdapter.updateOne(
          { id: conversation.conversationId, changes: conversation },
          state,
        );
      }
      return chatAdapter.addOne(conversation, state);
    }),

    // ── WebSocket: incoming message updates conversation metadata ────────────

    // Mirror ChatStateService.updateConversationLastMessage
    on(MessageWebSocketActions.messageReceived, (state, { message }) => {
      if (!message.conversationId) return state;
      return chatAdapter.updateOne(
        {
          id: message.conversationId,
          changes: {
            lastMessageText: message.messageText,
            lastMessageSenderId: message.senderId,
            lastActivity: message.sentAt.toISOString(),
            // Only increment unread if this is NOT the active conversation.
            // Never compute locally — use server-provided unreadCount when available.
            unreadCount:
              state.activeConversationId === message.conversationId
                ? 0
                : (message.unreadCount ?? 0),
          },
        },
        state,
      );
    }),

    // ── Mark conversation read → clear badge ────────────────────────────────

    // Mirror ChatStateService.markConversationAsRead (optimistic)
    on(MessageApiActions.markReadSuccess, (state, { conversationId }) =>
      chatAdapter.updateOne(
        { id: conversationId, changes: { unreadCount: 0 } },
        state,
      ),
    ),

    // ── Presence: update isOnline on conversation entities ───────────────────

    // Mirror ChatStateService.updateUserStatus
    on(PresenceActions.userCameOnline, (state, { userId }) =>
      chatAdapter.map(
        (c) => (c.userId === userId ? { ...c, isOnline: true } : c),
        state,
      ),
    ),

    on(PresenceActions.userWentOffline, (state, { userId }) =>
      chatAdapter.map(
        (c) => (c.userId === userId ? { ...c, isOnline: false } : c),
        state,
      ),
    ),

    // ── Typing indicators ────────────────────────────────────────────────────

    // Mirror ChatStateService.setTypingIndicator
    on(PresenceActions.userStartedTyping, (state, { userId }) =>
      chatAdapter.map(
        (c) => (c.userId === userId ? { ...c, isTyping: true } : c),
        state,
      ),
    ),

    on(PresenceActions.userStoppedTyping, (state, { userId }) =>
      chatAdapter.map(
        (c) => (c.userId === userId ? { ...c, isTyping: false } : c),
        state,
      ),
    ),

    // ── User search ──────────────────────────────────────────────────────────

    on(ChatActions.searchQueryChanged, (state) => ({
      ...state,
      searchStatus: 'loading' as const,
    })),

    on(ChatApiActions.searchSuccess, (state, { results }) => ({
      ...state,
      searchResults: results,
      searchStatus: 'idle' as const,
    })),

    on(ChatApiActions.searchFailure, (state) => ({
      ...state,
      searchStatus: 'error' as const,
    })),
  ),
});
