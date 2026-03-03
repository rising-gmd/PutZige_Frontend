import { Conversation } from '../models/conversation.model';
import { User } from '../models/user.model';
import { ConversationDto, UserDto } from '../models/api-response.model';
import { ConversationResponse } from '../services/chat-api.service';

/**
 * Builds a full Conversation entity from the lean create/get API response and
 * the User already present in the store. Avoids a second round-trip to
 * hydrate display fields.
 */
export function mapConversationResponseToModel(
  response: ConversationResponse,
  user: User,
): Conversation {
  return {
    conversationId: response.conversationId,
    userId: user.id,
    username: user.username,
    displayName: user.displayName,
    profilePictureUrl: user.profilePictureUrl,
    isOnline: user.isOnline,
    unreadCount: 0,
    lastActivity: response.lastActivity,
  };
}

/** Maps a backend ConversationDto to the domain Conversation. */
export function mapConversationDtoToConversation(
  dto: ConversationDto,
): Conversation {
  return {
    conversationId: dto.conversationId,
    userId: dto.userId,
    username: dto.username,
    displayName: dto.displayName,
    profilePictureUrl: dto.profilePictureUrl,
    isOnline: dto.isOnline,
    unreadCount: dto.unreadCount,
    lastActivity: dto.lastActivity,
    lastMessageText: dto.lastMessage?.messageText,
    lastMessageSentAt: dto.lastMessage?.sentAt,
    lastMessageSenderId: dto.lastMessage?.senderId,
  };
}

/** Maps a backend UserDto to the domain User. */
export function mapUserDtoToUser(dto: UserDto): User {
  return {
    id: dto.id,
    username: dto.username,
    email: dto.email,
    displayName: dto.displayName,
    jobTitle: dto.jobTitle,
    bio: dto.bio,
    profilePictureUrl: dto.profilePictureUrl,
    isOnline: false,
  };
}
