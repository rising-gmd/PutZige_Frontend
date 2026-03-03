import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { concatLatestFrom } from '@ngrx/operators';
import {
  catchError,
  concatMap,
  EMPTY,
  filter,
  from,
  map,
  mergeMap,
  of,
} from 'rxjs';
import { ChatApiService } from '../../features/chat/services/chat-api.service';
import { SignalRService } from '../../features/chat/services/signalr.service';
import { ConversationService } from '../../features/chat/services/conversation.service';
import { ChatActions } from '../chat/chat.actions';
import { MessageActions, MessageApiActions } from './messages.actions';
import { selectLoadedConversationIds } from './messages.selectors';
import { selectConversationEntities } from '../chat/chat.selectors';
import { extractErrorMessage } from '../../core/utils/error.util';
import {
  mapMessageDtoToMessage,
  mapSendResponseToMessage,
} from '../../features/chat/mappers';

@Injectable()
export class MessagesEffects {
  private readonly actions$ = inject(Actions);
  private readonly store = inject(Store);
  private readonly chatApi = inject(ChatApiService);
  private readonly signalR = inject(SignalRService);
  private readonly conversationService = inject(ConversationService);

  // ── History Loading ──────────────────────────────────────────────────────

  /**
   * Load message history when a conversation is selected — but only once.
   * Already-loaded conversations are skipped to avoid redundant API calls.
   * concatMap preserves load ordering if the user switches conversations rapidly.
   */
  readonly loadMessages$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ChatActions.conversationSelected),
      concatLatestFrom(() => this.store.select(selectLoadedConversationIds)),
      filter(
        ([{ conversationId }, loadedIds]) =>
          !loadedIds.includes(conversationId),
      ),
      concatMap(([{ conversationId }]) =>
        this.chatApi.getConversationHistory(conversationId).pipe(
          map((response) =>
            MessageApiActions.loadSuccess({
              conversationId,
              messages: response.messages.map((dto) =>
                mapMessageDtoToMessage(dto, conversationId),
              ),
            }),
          ),
          catchError((err: unknown) =>
            of(
              MessageApiActions.loadFailure({
                error: extractErrorMessage(err),
              }),
            ),
          ),
        ),
      ),
    ),
  );

  // ── Sending Messages ─────────────────────────────────────────────────────

  /**
   * Attempt to send a message via SignalR (fast, bidirectional).
   *
   * On SignalR success: no dispatch needed — the server will push back its own
   * ACK via `onMessageSent` which becomes `messageSentAck` and reconciles the
   * optimistic placeholder in the reducer.
   *
   * On SignalR failure: fall back to the REST endpoint so the message is never
   * silently lost. REST success dispatches `sendSuccess` to reconcile the
   * optimistic message; failure dispatches `sendFailure` to mark it FAILED.
   *
   * Using concatMap to preserve send ordering when messages arrive back-to-back.
   */
  readonly sendMessage$ = createEffect(() =>
    this.actions$.pipe(
      ofType(MessageActions.sendRequested),
      concatMap(({ tempId, conversationId, text }) =>
        from(this.signalR.sendMessage(conversationId, text, tempId)).pipe(
          // SignalR success — ACK arrives via WebSocket, no action needed here.
          concatMap(() => EMPTY),
          catchError(() =>
            // SignalR failed — fall back to REST so the message is not lost.
            this.chatApi
              .sendMessage({ conversationId, messageText: text })
              .pipe(
                map((response) =>
                  MessageApiActions.sendSuccess({
                    tempId,
                    message: mapSendResponseToMessage(response),
                  }),
                ),
                catchError((err: unknown) =>
                  of(
                    MessageApiActions.sendFailure({
                      tempId,
                      error: extractErrorMessage(err),
                    }),
                  ),
                ),
              ),
          ),
        ),
      ),
    ),
  );

  // ── Mark Conversation as Read ────────────────────────────────────────────

  /**
   * Clear the unread badge after the user opens a conversation.
   * This is best-effort — failures are intentionally swallowed to avoid
   * surfacing a snackbar for a non-critical bookkeeping call.
   * mergeMap so selecting multiple conversations quickly doesn't queue up.
   */
  readonly markRead$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ChatActions.conversationSelected),
      concatLatestFrom(() => this.store.select(selectConversationEntities)),
      filter(([{ conversationId }, entities]) => {
        const conv = entities[conversationId];
        return (conv?.unreadCount ?? 0) > 0;
      }),
      mergeMap(([{ conversationId }]) =>
        this.conversationService.markConversationAsRead(conversationId).pipe(
          map(() => MessageApiActions.markReadSuccess({ conversationId })),
          catchError(() => EMPTY), // Non-critical — unread count clears locally anyway.
        ),
      ),
    ),
  );
}
