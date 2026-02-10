/**
 * DTO models matching backend API contracts (dates are ISO strings)
 */

export interface SendMessageRequest {
  receiverId: string;
  messageText: string;
}

export interface SendMessageResponse {
  messageId: string;
  senderId: string;
  receiverId: string;
  messageText: string;
  sentAt: string; // ISO date string
}

export interface ConversationHistoryResponse {
  messages: MessageDto[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

export interface MessageDto {
  id: string;
  senderId: string;
  receiverId: string;
  messageText: string;
  sentAt: string;
  deliveredAt?: string;
  readAt?: string;
}

export interface ConversationsListResponse {
  conversations: ConversationDto[];
  totalCount: number;
}

export interface ConversationDto {
  userId: string;
  username: string;
  displayName: string;
  jobTitle?: string;
  profilePictureUrl?: string;
  isOnline: boolean;
  lastMessage?: MessageDto;
  unreadCount: number;
  lastActivity: string;
}

export interface UserSearchResponse {
  users: UserDto[];
  totalCount: number;
}

export interface UserDto {
  id: string;
  username: string;
  displayName: string;
  email: string;
  jobTitle?: string;
  bio?: string;
  profilePictureUrl?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  responseCode: string;
  message?: string;
}
