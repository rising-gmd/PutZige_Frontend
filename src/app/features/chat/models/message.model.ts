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
  /** Marked for optimistic UI before server ack */
  readonly isOptimistic?: boolean;
  /** Temporary client-side id used for optimistic messages */
  readonly tempId?: string;
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
