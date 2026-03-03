// Centralized SignalR event names and payload types.
// These must match backend SignalRConstants.Events exactly.
export const SignalREvents = {
  ReceiveMessage: 'ReceiveMessage',
  MessageDelivered: 'MessageDelivered',
  MessageRead: 'MessageRead',
  MessageSent: 'MessageSent',
  UserOnline: 'UserOnline',
  UserOffline: 'UserOffline',
  UserTyping: 'UserTyping',
  UserStoppedTyping: 'UserStoppedTyping',
  ConversationCreated: 'ConversationCreated',
  Error: 'Error',
} as const;

export type SignalREventName =
  (typeof SignalREvents)[keyof typeof SignalREvents];

// ── Wire-format payload shapes ──────────────────────────────────────────────
// Timestamps arrive as ISO strings; mappers convert them to Date instances.

export interface ReceiveMessagePayload {
  /** Legacy field name — prefer messageId when both are absent. */
  id?: string;
  /** Server SendMessageResponse field name. */
  messageId?: string;
  senderId: string;
  receiverId: string;
  messageText: string;
  sentAt?: string | Date;
  deliveredAt?: string | Date;
  readAt?: string | Date;
  conversationId?: string;
  unreadCount?: number;
}

export interface MessageDeliveredPayload {
  messageId: string;
  deliveredAt: string | Date;
}

export interface MessageReadPayload {
  messageId: string;
  readAt: string | Date;
}

export interface MessageSentPayload {
  conversationId: string;
  messageId: string;
  senderId: string;
  receiverId: string;
  messageText: string;
  sentAt: string | Date;
  /** Client-generated tempId echoed by the server for optimistic reconciliation. */
  tempId?: string;
}

export interface UserStatusPayload {
  userId: string;
  lastSeen?: string | Date;
}

export interface TypingPayload {
  userId: string;
  conversationId: string;
}

export interface ConversationCreatedPayload {
  conversationId: string;
  userId?: string;
  username?: string;
  displayName?: string;
  profilePictureUrl?: string;
  isOnline?: boolean;
  lastActivity?: string;
}

export interface HubErrorPayload {
  message: string;
  code?: string;
}

// ── Typed event map ─────────────────────────────────────────────────────────
// Maps every hub event name to its exact wire-format payload type.
// Extending the hub? Add an entry here — the compiler enforces coverage.
export interface SignalREventMap {
  [SignalREvents.ReceiveMessage]: ReceiveMessagePayload;
  [SignalREvents.MessageDelivered]: MessageDeliveredPayload;
  [SignalREvents.MessageRead]: MessageReadPayload;
  [SignalREvents.MessageSent]: MessageSentPayload;
  [SignalREvents.UserOnline]: UserStatusPayload;
  [SignalREvents.UserOffline]: UserStatusPayload;
  [SignalREvents.UserTyping]: TypingPayload;
  [SignalREvents.UserStoppedTyping]: TypingPayload;
  [SignalREvents.ConversationCreated]: ConversationCreatedPayload;
  [SignalREvents.Error]: HubErrorPayload;
}

export interface UserStatusPayload {
  userId: string;
  lastSeen?: string | Date;
}

export interface TypingPayload {
  userId: string;
  conversationId: string;
}

export interface ErrorPayload {
  message: string;
}
