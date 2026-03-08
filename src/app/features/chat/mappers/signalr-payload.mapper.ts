import { isDevMode } from '@angular/core';
import { parseDate } from '../../../core/utils/date.util';
import { Message, MessageStatus } from '../models/message.model';
import { Conversation } from '../models/conversation.model';
import { UserStatus } from '../models/user.model';
import {
  ConversationCreatedPayload,
  MessageDeliveredPayload,
  MessageEditedPayload,
  MessageReadPayload,
  MessageSentPayload,
  ReceiveMessagePayload,
  TypingPayload,
  UserStatusPayload,
} from '../services/signalr-events.constants';
import {
  ConversationCreatedPayloadSchema,
  MessageDeliveredPayloadSchema,
  MessageEditedPayloadSchema,
  MessageReadPayloadSchema,
  MessageSentPayloadSchema,
  ReceiveMessagePayloadSchema,
  TypingPayloadSchema,
  UserStatusPayloadSchema,
} from '../schemas';

//  Internal helper

function warnInvalid(event: string, issues: { message: string }[]): void {
  if (isDevMode()) {
    console.warn(
      `[SignalR] ${event} payload failed validation`,
      issues.map((i) => i.message),
    );
  }
}

//  Exported mappers

/** Maps an inbound ReceiveMessage hub payload to the domain Message. */
export function mapReceiveMessagePayload(
  p: ReceiveMessagePayload,
): Message | null {
  const result = ReceiveMessagePayloadSchema.safeParse(p);
  if (!result.success) {
    warnInvalid('ReceiveMessage', result.error.issues);
    return null;
  }

  const { data } = result;
  const id = data.id ?? data.messageId!;

  return {
    id,
    senderId: data.senderId,
    receiverId: data.receiverId,
    messageText: data.messageText,
    conversationId: data.conversationId,
    sentAt: parseDate(data.sentAt) ?? new Date(),
    deliveredAt: parseDate(data.deliveredAt) ?? undefined,
    readAt: parseDate(data.readAt) ?? undefined,
    unreadCount: data.unreadCount ?? 0,
  };
}

/** Maps a MessageDelivered payload to { messageId, deliveredAt }. */
export function mapMessageDeliveredPayload(
  p: MessageDeliveredPayload,
): { messageId: string; deliveredAt: Date } | null {
  const result = MessageDeliveredPayloadSchema.safeParse(p);
  if (!result.success) {
    warnInvalid('MessageDelivered', result.error.issues);
    return null;
  }

  const deliveredAt = parseDate(result.data.deliveredAt);
  return deliveredAt ? { messageId: result.data.messageId, deliveredAt } : null;
}

/** Maps a MessageEdited payload to { messageId, messageText, editedAt }. */
export function mapMessageEditedPayload(
  p: MessageEditedPayload,
): { messageId: string; messageText: string; editedAt: Date } | null {
  const result = MessageEditedPayloadSchema.safeParse(p);
  if (!result.success) {
    warnInvalid('MessageEdited', result.error.issues);
    return null;
  }
  const editedAt = result.data.editedAt
    ? (parseDate(result.data.editedAt) ?? new Date())
    : new Date();
  return {
    messageId: result.data.messageId,
    messageText: result.data.messageText,
    editedAt,
  };
}

/** Maps a MessageRead payload to { messageId, readAt }. */
export function mapMessageReadPayload(
  p: MessageReadPayload,
): { messageId: string; readAt: Date } | null {
  const result = MessageReadPayloadSchema.safeParse(p);
  if (!result.success) {
    warnInvalid('MessageRead', result.error.issues);
    return null;
  }

  const readAt = parseDate(result.data.readAt);
  return readAt ? { messageId: result.data.messageId, readAt } : null;
}

/**
 * Validates and returns a MessageSent ACK payload.
 * Returns null on schema violations so the store is never corrupted by a
 * malformed ACK  the optimistic placeholder simply stays unreconciled.
 */
export function mapMessageSentPayload(
  p: MessageSentPayload,
): MessageSentPayload | null {
  const result = MessageSentPayloadSchema.safeParse(p);
  if (!result.success) {
    warnInvalid('MessageSent', result.error.issues);
    return null;
  }
  return result.data as MessageSentPayload;
}

/** Maps a UserStatus payload to the domain UserStatus. */
export function mapUserStatusPayload(
  p: UserStatusPayload,
  isOnline: boolean,
): UserStatus | null {
  const result = UserStatusPayloadSchema.safeParse(p);
  if (!result.success) {
    warnInvalid('UserStatus', result.error.issues);
    return null;
  }

  return {
    userId: result.data.userId,
    isOnline,
    lastSeen: parseDate(result.data.lastSeen) ?? undefined,
  };
}

/** Maps a Typing payload to { userId, conversationId }. */
export function mapTypingPayload(
  p: TypingPayload,
): { userId: string; conversationId: string } | null {
  const result = TypingPayloadSchema.safeParse(p);
  if (!result.success) {
    warnInvalid('Typing', result.error.issues);
    return null;
  }
  return {
    userId: result.data.userId,
    conversationId: result.data.conversationId,
  };
}

/** Maps a ConversationCreated payload to the domain Conversation. */
export function mapConversationCreatedPayload(
  p: ConversationCreatedPayload,
): Conversation | null {
  const result = ConversationCreatedPayloadSchema.safeParse(p);
  if (!result.success) {
    warnInvalid('ConversationCreated', result.error.issues);
    return null;
  }

  const { data } = result;
  return {
    conversationId: data.conversationId,
    userId: data.userId ?? '',
    username: data.username ?? '',
    displayName: data.displayName,
    profilePictureUrl: data.profilePictureUrl,
    isOnline: data.isOnline ?? false,
    unreadCount: 0,
    isPinned: false,
    lastActivity: data.lastActivity ?? new Date().toISOString(),
    isTyping: false,
  } satisfies Conversation;
}

/**
 * Maps a REST SendMessageResponse to a Message entity.
 * Re-exported here so effects always resolve mappers from one barrel.
 */
export { mapSendResponseToMessage } from './message.mapper';

/** Maps a MessageSent ACK to a full Message entity for store reconciliation. */
export function mapSentAckToMessage(p: MessageSentPayload): Message {
  return {
    id: p.messageId,
    senderId: p.senderId,
    receiverId: p.receiverId,
    messageText: p.messageText,
    conversationId: p.conversationId,
    sentAt: parseDate(p.sentAt) ?? new Date(),
    status: MessageStatus.SENT,
  };
}
