import { Injectable, inject } from '@angular/core';
import { createEffect } from '@ngrx/effects';
import { debounceTime, map, tap } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { SignalRService } from '../../features/chat/services/signalr.service';
import { NotificationService } from '../../shared/services/notification.service';
import { UI_CONSTANTS } from '../../core/constants/ui.constants';
import { ConnectionActions } from './connection.actions';

/**
 * Bridges SignalR hub lifecycle events to ConnectionActions.
 *
 * Initial connect dispatch (ConnectionActions.connected) lives in
 * ChatEffects.connectSignalR$ because that effect already holds the
 * startConnection() Promise resolution. Re-connect and disconnect lifecycle
 * is handled here via the SignalRService Observables.
 */
@Injectable()
export class ConnectionEffects {
  private readonly signalR = inject(SignalRService);
  private readonly notifications = inject(NotificationService);
  private readonly translate = inject(TranslateService);

  /** Hub reconnected after a transient failure. */
  readonly reconnected$ = createEffect(() =>
    this.signalR.onReconnected.pipe(map(() => ConnectionActions.connected())),
  );

  /** Hub connection lost; auto-reconnect in progress. */
  readonly reconnecting$ = createEffect(() =>
    this.signalR.onReconnecting.pipe(
      map(() => ConnectionActions.reconnecting()),
    ),
  );

  /** Hub connection permanently closed. */
  readonly disconnected$ = createEffect(() =>
    this.signalR.onDisconnected.pipe(
      map(() => ConnectionActions.disconnected()),
    ),
  );

  /**
   * Show a persistent toast when the hub has been permanently disconnected
   * for longer than DISCONNECT_TOAST_DELAY_MS.  debounceTime ensures rapid
   * disconnect/reconnect cycles (normal auto-reconnect) do not surface a
   * toast — only a genuine unrecoverable drop reaches the user.
   */
  readonly disconnectToast$ = createEffect(
    () =>
      this.signalR.onDisconnected.pipe(
        debounceTime(UI_CONSTANTS.DISCONNECT_TOAST_DELAY_MS),
        tap(() => {
          const detail = this.translate.instant(
            'connection.toast.disconnected',
          );
          this.notifications.showWarn(detail, { sticky: true });
        }),
      ),
    { dispatch: false },
  );
}
