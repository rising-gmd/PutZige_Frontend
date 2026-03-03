/**
 * Message domain model used at runtime.
 */
export interface Message {
  readonly id: string;
  readonly senderId: string;
  readonly receiverId: string;
  readonly messageText: string;
  readonly sentAt: Date;
  readonly deliveredAt?: Date;
  readonly readAt?: Date;
  /** Optional conversation id associated with the message (provided by server) */
  readonly conversationId?: string;
  /** Server-provided unread count for the conversation at the time this message was sent */
  readonly unreadCount?: number;
  /** Marked for optimistic UI before server ack */
  readonly isOptimistic?: boolean;
  /** Temporary client-side id used for optimistic messages */
  readonly tempId?: string;
  /**
   * Explicit send status for optimistic messages.
   * Set to 'sending' on optimistic add, 'sent'/'delivered'/'read' on ack,
   * 'failed' on send failure. Undefined for messages loaded from history.
   */
  readonly status?: MessageStatus;
}

/**
 * Status enum used for UI state and telemetry
 */
export enum MessageStatus {
  SENDING = 'sending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
}

/**
 * Group of messages for rendering (e.g. consecutive messages from same sender)
 */
export interface MessageGroup {
  sender: 'me' | 'them';
  messages: Message[];
  timestamp: Date;
}
