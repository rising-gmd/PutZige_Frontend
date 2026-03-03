import { EntityState, createEntityAdapter } from '@ngrx/entity';
import { Message } from '../../features/chat/models/message.model';

export interface MessagesState extends EntityState<Message> {
  /** Conversation IDs whose history has been loaded at least once. */
  loadedConversationIds: string[];
  /** The conversation currently being fetched; null when idle. */
  loadingConversationId: string | null;
  /** Temporary IDs for optimistic messages currently in-flight to the server. */
  sendingTempIds: string[];
  error: string | null;
}

export const messagesAdapter = createEntityAdapter<Message>({
  selectId: (m) => m.id,
  sortComparer: false,
});

export const initialMessagesState: MessagesState =
  messagesAdapter.getInitialState({
    loadedConversationIds: [],
    loadingConversationId: null,
    sendingTempIds: [],
    error: null,
  });
