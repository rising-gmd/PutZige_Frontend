import { createActionGroup, props } from '@ngrx/store';
import { Message } from '../../features/chat/models/message.model';
import { MessageSentPayload } from '../../features/chat/services/signalr-events.constants';

/**
 * Actions dispatched by chat UI components for message operations.
 * Source: 'Messages'
 */
export const MessageActions = createActionGroup({
  source: 'Messages',
  events: {
    /** Request to load paginated history for a conversation. */
    'Load Requested': props<{ conversationId: string; page?: number }>(),

    /**
     * User pressed send. Reducer adds optimistic message immediately.
     * senderId/receiverId are required to build a renderable optimistic Message.
     */
    'Send Requested': props<{
      conversationId: string;
      text: string;
      tempId: string;
      senderId: string;
      receiverId: string;
    }>(),

    /** Mark all messages in a conversation as read for the current user. */
    'Mark Read': props<{ conversationId: string }>(),
  },
});

/**
 * Actions dispatched by REST API effects — server responses for messages.
 * Source: 'Messages API'
 */
export const MessageApiActions = createActionGroup({
  source: 'Messages API',
  events: {
    'Load Success': props<{ conversationId: string; messages: Message[] }>(),
    'Load Failure': props<{ error: string }>(),
    'Send Success': props<{ tempId: string; message: Message }>(),
    'Send Failure': props<{ tempId: string; error: string }>(),
    'Mark Read Success': props<{ conversationId: string }>(),
  },
});

/**
 * Actions dispatched when a WebSocket push arrives for messages.
 * Source: 'Messages WebSocket'
 */
export const MessageWebSocketActions = createActionGroup({
  source: 'Messages WebSocket',
  events: {
    /** Inbound message from another user or the server relay. */
    'Message Received': props<{ message: Message }>(),

    /** Server confirms message was delivered to recipient. */
    'Message Delivered': props<{ messageId: string; deliveredAt: Date }>(),

    /** Server confirms message was read by recipient. */
    'Message Read': props<{ messageId: string; readAt: Date }>(),

    /**
     * Server ACK for a message the current user sent via SignalR.
     * Used to reconcile an optimistic message with its real server ID.
     */
    'Message Sent Ack': props<{ payload: MessageSentPayload }>(),
  },
});
