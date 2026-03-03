import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { Conversation } from '../../features/chat/models/conversation.model';
import { User } from '../../features/chat/models/user.model';

/**
 * Actions dispatched by chat UI components (user intent).
 * Source: 'Chat'
 */
export const ChatActions = createActionGroup({
  source: 'Chat',
  events: {
    /**
     * Dispatched when the chat page is mounted.
     * Triggers current-user load → conversations load → SignalR start.
     */
    'Page Opened': emptyProps(),

    /** User selects a conversation item in the sidebar. */
    'Conversation Selected': props<{ conversationId: string }>(),

    /**
     * User selects a contact from new-chat modal.
     * Effect handles fast-path (existing conv) and slow-path (API creation).
     */
    'New Conversation Started': props<{ user: User }>(),

    // The following are stubs for future implementation (INC-XXXX).
    'Archive Conversation': props<{ conversationId: string }>(),
    'Delete Conversation': props<{ conversationId: string }>(),
    'Block User': props<{ userId: string }>(),

    /** Dispatched as the user types in the conversation search field. */
    'Search Query Changed': props<{ query: string }>(),
  },
});

/**
 * Actions dispatched by HTTP API effects — server responses.
 * Source: 'Chat API'
 */
export const ChatApiActions = createActionGroup({
  source: 'Chat API',
  events: {
    'Conversations Load Success': props<{ conversations: Conversation[] }>(),
    'Conversations Load Failure': props<{ error: string }>(),
    'Current User Load Success': props<{ user: User }>(),
    'Current User Load Failure': props<{ error: string }>(),
    'Search Success': props<{ results: User[] }>(),
    'Search Failure': props<{ error: string }>(),
    'Create Conversation Success': props<{ conversation: Conversation }>(),
    'Create Conversation Failure': props<{ error: string }>(),
  },
});

/**
 * Actions dispatched when a WebSocket push arrives for conversations.
 * Source: 'Chat WebSocket'
 */
export const ChatWebSocketActions = createActionGroup({
  source: 'Chat WebSocket',
  events: {
    /** A new conversation was created and pushed by the server. */
    'Conversation Received': props<{ conversation: Conversation }>(),
  },
});
