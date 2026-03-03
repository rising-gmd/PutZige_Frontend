import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { groupBy, mergeMap, map, switchMap, timer } from 'rxjs';
import { PresenceActions } from './presence.actions';
import { UI_CONSTANTS } from '../../core/constants/ui.constants';

/**
 * PresenceEffects
 *
 * The SignalR → store bridges for online/offline events live in ChatEffects.
 * This class owns the client-side "presence safety net":
 *
 *  autoStopTyping$ — if the server fails to emit UserStoppedTyping within
 *  TYPING_CLEAR_TIMEOUT_MS of the last UserTyping event, the typing indicator
 *  is cleared automatically, preventing a stuck "is typing…" display.
 *
 *  Implementation:
 *  - groupBy creates an independent sub-stream per userId × conversationId pair.
 *  - switchMap inside each group cancels the pending timer when a new typing
 *    event arrives for the same pair (i.e. the typist is still going).
 *  - mergeMap joins all per-pair streams so groups run concurrently.
 */
@Injectable()
export class PresenceEffects {
  private readonly actions$ = inject(Actions);

  readonly autoStopTyping$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PresenceActions.userStartedTyping),
      groupBy(({ userId, conversationId }) => `${userId}:${conversationId}`),
      mergeMap((group$) =>
        group$.pipe(
          switchMap(({ userId, conversationId }) =>
            timer(UI_CONSTANTS.TYPING_CLEAR_TIMEOUT_MS).pipe(
              map(() =>
                PresenceActions.userStoppedTyping({ userId, conversationId }),
              ),
            ),
          ),
        ),
      ),
    ),
  );
}
