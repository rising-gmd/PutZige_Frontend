import { Message } from './message.model';
import { User } from './user.model';

/**
 * Conversation summary shown in the conversation list
 */
export interface Conversation {
  readonly id: string;
  readonly otherUser: User;
  readonly lastMessage?: Message;
  readonly unreadCount: number;
  readonly isPinned: boolean;
  readonly lastActivity: Date;
  readonly isTyping?: boolean;
}

export interface ConversationListResponse {
  readonly conversations: Conversation[];
  readonly totalCount: number;
}
