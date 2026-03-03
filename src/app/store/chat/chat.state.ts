import { EntityState, createEntityAdapter } from '@ngrx/entity';
import { Conversation } from '../../features/chat/models/conversation.model';
import { User } from '../../features/chat/models/user.model';

export interface ChatState extends EntityState<Conversation> {
  activeConversationId: string | null;
  currentUser: User | null;
  /** 'idle' | 'loading' | 'loaded' | 'error' */
  loadingStatus: 'idle' | 'loading' | 'loaded' | 'error';
  error: string | null;
  searchResults: User[];
  searchStatus: 'idle' | 'loading' | 'error';
}

export const chatAdapter = createEntityAdapter<Conversation>({
  selectId: (c) => c.conversationId,
  // Sorting is handled by a memoized selector, not the adapter, to avoid
  // re-sorting the entire collection on every entity change.
  sortComparer: false,
});

export const initialChatState: ChatState = chatAdapter.getInitialState({
  activeConversationId: null,
  currentUser: null,
  loadingStatus: 'idle',
  error: null,
  searchResults: [],
  searchStatus: 'idle',
});
