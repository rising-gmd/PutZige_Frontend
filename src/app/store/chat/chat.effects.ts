import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { concatLatestFrom } from '@ngrx/operators';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  exhaustMap,
  filter,
  from,
  map,
  of,
  switchMap,
  tap,
} from 'rxjs';
import { ChatApiService } from '../../features/chat/services/chat-api.service';
import { SignalRService } from '../../features/chat/services/signalr.service';
import { CHAT_CONSTANTS } from '../../core/constants/chat.constants';
import { UI_CONSTANTS } from '../../core/constants/ui.constants';
import {
  ChatActions,
  ChatApiActions,
  ChatWebSocketActions,
} from './chat.actions';
import { MessageWebSocketActions } from '../messages/messages.actions';
import { PresenceActions } from '../presence/presence.actions';
import { selectAllConversations } from './chat.selectors';
import { extractErrorMessage } from '../../core/utils/error.util';
import { Conversation } from '../../features/chat/models/conversation.model';
import { ConversationResponse } from '../../features/chat/services/chat-api.service';
import { User } from '../../features/chat/models/user.model';

@Injectable()
export class ChatEffects {
  private readonly actions$ = inject(Actions);
  private readonly store = inject(Store);
  private readonly chatApi = inject(ChatApiService);
  private readonly signalR = inject(SignalRService);

  // ── Initialization ──────────────────────────────────────────────────────

  /**
   * On page open, load the authenticated user's profile.
   * Using exhaustMap so rapid re-mounts do not stack API calls.
   */
  readonly initCurrentUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ChatActions.pageOpened),
      exhaustMap(() =>
        this.chatApi.getCurrentUser().pipe(
          map((user) => ChatApiActions.currentUserLoadSuccess({ user })),
          catchError((err: unknown) =>
            of(
              ChatApiActions.currentUserLoadFailure({
                error: extractErrorMessage(err),
              }),
            ),
          ),
        ),
      ),
    ),
  );

  /**
   * After the current user is resolved, fetch the conversation list.
   * Using exhaustMap so repeated auth refreshes don't stack list calls.
   */
  readonly loadConversations$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ChatApiActions.currentUserLoadSuccess),
      exhaustMap(() =>
        this.chatApi.getConversations().pipe(
          map((conversations) =>
            ChatApiActions.conversationsLoadSuccess({ conversations }),
          ),
          catchError((err: unknown) =>
            of(
              ChatApiActions.conversationsLoadFailure({
                error: extractErrorMessage(err),
              }),
            ),
          ),
        ),
      ),
    ),
  );

  /**
   * Start the SignalR hub connection when the chat page opens.
   * Failure to connect is non-fatal — the app continues with REST polling.
   */
  readonly connectSignalR$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(ChatActions.pageOpened),
        exhaustMap(() =>
          from(this.signalR.startConnection()).pipe(
            catchError(() => of(null)), // Connection failures are non-fatal here.
          ),
        ),
        tap(() => {
          /* Connection managed by SignalRService internally. */
        }),
      ),
    { dispatch: false },
  );

  // ── User Search ──────────────────────────────────────────────────────────

  /**
   * Debounce search queries — avoids hitting the API on every keystroke.
   * Short queries (< 2 chars) return an empty result set immediately.
   */
  readonly searchUsers$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ChatActions.searchQueryChanged),
      debounceTime(UI_CONSTANTS.SEARCH_DEBOUNCE_MS),
      distinctUntilChanged((a, b) => a.query === b.query),
      switchMap(({ query }) => {
        if (query.trim().length < CHAT_CONSTANTS.SEARCH_MIN_QUERY_LENGTH) {
          return of(ChatApiActions.searchSuccess({ results: [] }));
        }
        return this.chatApi.searchUsers(query).pipe(
          map((results) => ChatApiActions.searchSuccess({ results })),
          catchError((err: unknown) =>
            of(
              ChatApiActions.searchFailure({ error: extractErrorMessage(err) }),
            ),
          ),
        );
      }),
    ),
  );

  // ── Start New Conversation ───────────────────────────────────────────────

  /**
   * Open an existing conversation immediately (fast-path) or create one
   * via the API if none exists (slow-path).
   *
   * Fast-path: conversation with userId already in store → select it.
   * Slow-path: POST to API → map response + User to Conversation → add to store + select.
   */
  readonly startConversation$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ChatActions.newConversationStarted),
      concatLatestFrom(() => this.store.select(selectAllConversations)),
      switchMap(([{ user }, conversations]) => {
        const existing = conversations.find((c) => c.userId === user.id);
        if (existing) {
          return of(
            ChatActions.conversationSelected({
              conversationId: existing.conversationId,
            }),
          );
        }

        return this.chatApi.createOrGetConversation(user.id).pipe(
          map((response: ConversationResponse) =>
            ChatApiActions.createConversationSuccess({
              conversation: mapConversationResponseToModel(response, user),
            }),
          ),
          catchError((err: unknown) =>
            of(
              ChatApiActions.createConversationFailure({
                error: extractErrorMessage(err),
              }),
            ),
          ),
        );
      }),
    ),
  );

  /**
   * After a new conversation is created via API, select it automatically
   * so the user lands in the conversation they just started.
   */
  readonly selectAfterCreate$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ChatApiActions.createConversationSuccess),
      map(({ conversation }) =>
        ChatActions.conversationSelected({
          conversationId: conversation.conversationId,
        }),
      ),
    ),
  );

  // ── SignalR → Store bridges ──────────────────────────────────────────────
  // Each effect maps an inbound WebSocket event to a dispatchable action.
  // All use map() — there is no async work here, just shape transformation.

  readonly listenMessageReceived$ = createEffect(() =>
    this.signalR.onMessageReceived.pipe(
      map((message) => MessageWebSocketActions.messageReceived({ message })),
    ),
  );

  readonly listenMessageDelivered$ = createEffect(() =>
    this.signalR.onMessageDelivered.pipe(
      map(({ messageId, deliveredAt }) =>
        MessageWebSocketActions.messageDelivered({ messageId, deliveredAt }),
      ),
    ),
  );

  readonly listenMessageRead$ = createEffect(() =>
    this.signalR.onMessageRead.pipe(
      map(({ messageId, readAt }) =>
        MessageWebSocketActions.messageRead({ messageId, readAt }),
      ),
    ),
  );

  /**
   * Server ACK for a message we sent via SignalR.
   * The reducer will reconcile the optimistic placeholder using
   * messageText + senderId matching (tempId is not carried by the ACK).
   */
  readonly listenMessageSentAck$ = createEffect(() =>
    this.signalR.onMessageSent.pipe(
      map((payload) => MessageWebSocketActions.messageSentAck({ payload })),
    ),
  );

  readonly listenUserOnline$ = createEffect(() =>
    this.signalR.onUserOnline.pipe(
      filter((status) => status.isOnline),
      map(({ userId }) => PresenceActions.userCameOnline({ userId })),
    ),
  );

  readonly listenUserOffline$ = createEffect(() =>
    this.signalR.onUserOffline.pipe(
      filter((status) => !status.isOnline),
      map(({ userId }) => PresenceActions.userWentOffline({ userId })),
    ),
  );

  readonly listenTypingStart$ = createEffect(() =>
    this.signalR.onUserTyping.pipe(
      map(({ userId, conversationId }) =>
        PresenceActions.userStartedTyping({ userId, conversationId }),
      ),
    ),
  );

  readonly listenTypingStop$ = createEffect(() =>
    this.signalR.onUserStoppedTyping.pipe(
      map(({ userId, conversationId }) =>
        PresenceActions.userStoppedTyping({ userId, conversationId }),
      ),
    ),
  );

  readonly listenConversationCreated$ = createEffect(() =>
    this.signalR.onConversationCreated.pipe(
      map((conversation) =>
        ChatWebSocketActions.conversationReceived({ conversation }),
      ),
    ),
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Build a full Conversation entity from the lean API response + the User
 * object that was already in the store (from search results / contacts list).
 * This avoids a second API round-trip to hydrate display fields.
 */
function mapConversationResponseToModel(
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
