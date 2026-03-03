import { parseDate } from '../../../core/utils/date.util';
import { Message, MessageStatus } from '../models/message.model';
import { MessageDto, SendMessageResponse } from '../models/api-response.model';

/**
 * Maps a backend MessageDto (ISO string dates) to the runtime Message model.
 * `conversationId` is passed explicitly — the DTO belongs to the route context.
 */
export function mapMessageDtoToMessage(
  dto: MessageDto,
  conversationId: string,
): Message {
  return {
    id: dto.id,
    senderId: dto.senderId,
    receiverId: dto.receiverId,
    messageText: dto.messageText,
    conversationId,
    sentAt: parseDate(dto.sentAt) ?? new Date(),
    deliveredAt:
      dto.deliveredAt != null
        ? (parseDate(dto.deliveredAt) ?? undefined)
        : undefined,
    readAt:
      dto.readAt != null ? (parseDate(dto.readAt) ?? undefined) : undefined,
  };
}

/**
 * Maps a REST SendMessageResponse to a Message entity.
 * Used only on the SignalR → REST fallback path.
 */
export function mapSendResponseToMessage(res: SendMessageResponse): Message {
  return {
    id: res.messageId,
    senderId: res.senderId,
    receiverId: res.receiverId,
    messageText: res.messageText,
    conversationId: res.conversationId,
    sentAt: parseDate(res.sentAt) ?? new Date(),
    status: MessageStatus.SENT,
  };
}
