// kept imports intentionally minimal — Conversation is a flat DTO-aligned shape

/**
 * Conversation summary matching backend ConversationDto (flat)
 */
export interface Conversation {
  /** Conversation id from backend (stable identifier) */
  id: string;
  // User info (flat, not nested)
  userId: string;
  username: string;
  displayName?: string;
  profilePictureUrl?: string;
  isOnline: boolean;

  // Last message (flat, not nested object)
  lastMessageId?: string;
  lastMessageSenderId?: string;
  lastMessageReceiverId?: string;
  lastMessageText?: string;
  lastMessageSentAt?: string;
  lastMessageDeliveredAt?: string;
  lastMessageReadAt?: string;

  // Metadata
  unreadCount: number;
  lastActivity: string;

  // UI state (not from backend)
  isPinned?: boolean;
  isTyping?: boolean;
}

export interface ConversationListResponse {
  readonly conversations: Conversation[];
  readonly totalCount: number;
}
