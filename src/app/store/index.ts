/**
 * Store barrel — single import point for all store slices.
 *
 * Keeps the rest of the codebase decoupled from the internal folder structure.
 * When adding a new slice: add its exports here and register in app.config.ts.
 */

// ── State shapes ──────────────────────────────────────────────────────────────
export type { ChatState } from './chat/chat.state';
export type { MessagesState } from './messages/messages.state';
export type { PresenceState } from './presence/presence.state';
export type { ConnectionState } from './connection/connection.state';

// ── Root app state ────────────────────────────────────────────────────────────
import type { ChatState } from './chat/chat.state';
import type { MessagesState } from './messages/messages.state';
import type { PresenceState } from './presence/presence.state';
import type { ConnectionState } from './connection/connection.state';
import { chatFeature } from './chat/chat.reducer';
import { messagesFeature } from './messages/messages.reducer';
import { presenceFeature } from './presence/presence.reducer';
import { connectionFeature } from './connection/connection.reducer';

export interface AppState {
  [chatFeature.name]: ChatState;
  [messagesFeature.name]: MessagesState;
  [presenceFeature.name]: PresenceState;
  [connectionFeature.name]: ConnectionState;
}

// ── Features (reducers + auto-generated selectors) ───────────────────────────
export { chatFeature } from './chat/chat.reducer';
export { messagesFeature } from './messages/messages.reducer';
export { presenceFeature } from './presence/presence.reducer';
export { connectionFeature } from './connection/connection.reducer';

// ── Actions ───────────────────────────────────────────────────────────────────
export {
  ChatActions,
  ChatApiActions,
  ChatWebSocketActions,
} from './chat/chat.actions';
export {
  MessageActions,
  MessageApiActions,
  MessageWebSocketActions,
} from './messages/messages.actions';
export { PresenceActions } from './presence/presence.actions';
export { ConnectionActions } from './connection/connection.actions';

// ── Selectors ─────────────────────────────────────────────────────────────────
export {
  selectAllConversations,
  selectConversationEntities,
  selectActiveConversation,
  selectSortedConversations,
  selectTotalUnread,
} from './chat/chat.selectors';
export {
  selectActiveMessages,
  selectLoadedConversationIds,
  selectLoadingConversationId,
  selectIsMessageLoading,
} from './messages/messages.selectors';
export {
  selectOnlineUserIds,
  selectIsUserOnline,
  selectTypingUsersInConversation,
  selectIsAnyoneTyping,
} from './presence/presence.selectors';
export {
  selectConnectionStatus,
  selectIsConnected,
  selectIsReconnecting,
  selectIsDisconnected,
  selectShowConnectionBanner,
} from './connection/connection.selectors';

// ── Effects ───────────────────────────────────────────────────────────────────
export { ChatEffects } from './chat/chat.effects';
export { MessagesEffects } from './messages/messages.effects';
export { PresenceEffects } from './presence/presence.effects';
export { ConnectionEffects } from './connection/connection.effects';
