// Centralized SignalR event names and payload types
// These must match backend SignalRConstants.Events exactly
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

// Payload shapes (wire-format) coming from the SignalR hub.
// Timestamps are often serialized as strings; parsers in the service
// convert them to Date objects where appropriate.
export interface ReceiveMessagePayload {
  id: string;
  senderId: string;
  receiverId: string;
  messageText: string;
  sentAt?: string | Date;
  deliveredAt?: string | Date;
  readAt?: string | Date;
  conversationId?: string;
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
