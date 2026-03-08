import { createFeature, createReducer, on } from '@ngrx/store';
import { messagesAdapter, initialMessagesState } from './messages.state';
import {
  MessageActions,
  MessageApiActions,
  MessageWebSocketActions,
} from './messages.actions';
import {
  Message,
  MessageStatus,
} from '../../features/chat/models/message.model';
import { parseDate } from '../../core/utils/date.util';

export const messagesFeature = createFeature({
  name: 'messages',
  reducer: createReducer(
    initialMessagesState,

    // ── Request loading state ────────────────────────────────────────────────

    on(MessageActions.loadRequested, (state, { conversationId }) => ({
      ...state,
      loadingConversationId: conversationId,
      error: null,
    })),

    // ── Load history from REST API ───────────────────────────────────────────

    on(MessageApiActions.loadSuccess, (state, { conversationId, messages }) =>
      messagesAdapter.upsertMany(messages, {
        ...state,
        loadedConversationIds: [
          // Deduplicate: use Set to avoid duplicate entries on refresh loads.
          ...new Set([...state.loadedConversationIds, conversationId]),
        ],
        loadingConversationId: null,
      }),
    ),

    on(MessageApiActions.loadFailure, (state, { error }) => ({
      ...state,
      loadingConversationId: null,
      error,
    })),

    // ── Optimistic send: add placeholder immediately ─────────────────────────

    // Mirror ChatStateService.addMessageToConversation + optimistic flow.
    // senderId/receiverId come from the action so the message can render immediately.
    on(
      MessageActions.sendRequested,
      (state, { tempId, conversationId, text, senderId, receiverId }) =>
        messagesAdapter.addOne(
          {
            id: tempId,
            conversationId,
            messageText: text,
            senderId,
            receiverId,
            sentAt: new Date(),
            isOptimistic: true,
            status: MessageStatus.SENDING,
          } as Message,
          {
            ...state,
            sendingTempIds: [...state.sendingTempIds, tempId],
          },
        ),
    ),

    // ── REST fallback success: reconcile tempId → real message ──────────────

    // Mirror ChatStateService.replaceOptimisticMessage
    on(MessageApiActions.sendSuccess, (state, { tempId, message }) =>
      messagesAdapter.upsertOne(
        message,
        messagesAdapter.removeOne(tempId, {
          ...state,
          sendingTempIds: state.sendingTempIds.filter((id) => id !== tempId),
        }),
      ),
    ),

    // ── Send failure: mark as failed — do not silently remove ───────────────

    // Mirror ChatStateService.removeOptimisticMessage (improved: shows failure status).
    on(MessageApiActions.sendFailure, (state, { tempId }) =>
      messagesAdapter.updateOne(
        { id: tempId, changes: { status: MessageStatus.FAILED } },
        {
          ...state,
          sendingTempIds: state.sendingTempIds.filter((id) => id !== tempId),
        },
      ),
    ),

    // ── SignalR ACK: reconcile optimistic → real after server confirms ───────

    // Server echoes tempId back in the ACK (preferred path — O(1) lookup).
    // Fallback to messageText+senderId match for legacy ACKs without tempId.
    on(MessageWebSocketActions.messageSentAck, (state, { payload }) => {
      const optimistic =
        (payload.tempId ? state.entities[payload.tempId] : undefined) ??
        Object.values(state.entities).find(
          (m) =>
            m?.isOptimistic &&
            m.messageText === payload.messageText &&
            m.senderId === payload.senderId,
        );

      if (!optimistic) return state;

      const realMsg: Message = {
        id: payload.messageId,
        senderId: payload.senderId,
        receiverId: payload.receiverId,
        messageText: payload.messageText,
        conversationId: payload.conversationId,
        sentAt: parseDate(payload.sentAt) ?? new Date(),
        status: MessageStatus.SENT,
      };

      return messagesAdapter.upsertOne(
        realMsg,
        messagesAdapter.removeOne(optimistic.id, {
          ...state,
          sendingTempIds: state.sendingTempIds.filter(
            (id) => id !== optimistic.id,
          ),
        }),
      );
    }),

    // ── WebSocket: inbound message from other user or self (other device) ────

    on(MessageWebSocketActions.messageReceived, (state, { message }) =>
      messagesAdapter.upsertOne(message, state),
    ),

    // ── WebSocket: delivery / read status ────────────────────────────────────

    // Mirror ChatStateService.updateMessageStatus
    on(
      MessageWebSocketActions.messageDelivered,
      (state, { messageId, deliveredAt }) =>
        messagesAdapter.updateOne(
          {
            id: messageId,
            changes: { deliveredAt, status: MessageStatus.DELIVERED },
          },
          state,
        ),
    ),

    on(MessageWebSocketActions.messageRead, (state, { messageId, readAt }) =>
      messagesAdapter.updateOne(
        { id: messageId, changes: { readAt, status: MessageStatus.READ } },
        state,
      ),
    ),

    // ── Mark conversation read (badge cleared on API success) ────────────────

    on(MessageApiActions.markReadSuccess, (state) => state), // No message mutation needed here.

    // ── Message edit (REST response / WebSocket) ───────────────────────────

    on(
      MessageApiActions.editSuccess,
      (state, { messageId, messageText, editedAt }) =>
        messagesAdapter.updateOne(
          {
            id: messageId,
            changes: { messageText, isEdited: true, editedAt },
          },
          state,
        ),
    ),

    on(
      MessageWebSocketActions.messageEdited,
      (state, { messageId, messageText, editedAt }) =>
        messagesAdapter.updateOne(
          {
            id: messageId,
            changes: { messageText, isEdited: true, editedAt },
          },
          state,
        ),
    ),
  ),
});
