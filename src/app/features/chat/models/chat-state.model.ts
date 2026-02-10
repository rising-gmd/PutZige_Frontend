import { Conversation } from './conversation.model';
import { Message } from './message.model';
import { User } from './user.model';

/**
 * Centralized runtime chat state shape
 */
export interface ChatState {
  currentUser: User | null;
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: Record<string, Message[]>; // conversationId -> messages
  isLoadingConversations: boolean;
  isLoadingMessages: boolean;
  isSendingMessage: boolean;
  error: string | null;
}

export interface SignalRConnectionState {
  isConnected: boolean;
  connectionId: string | null;
  reconnectAttempts: number;
}
