import { Injectable, inject, signal, OnDestroy } from '@angular/core';
import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from '@microsoft/signalr';
import { Subject, firstValueFrom, timer } from 'rxjs';
import { AuthApiService } from '../../../features/auth/services/auth-api.service';
import { AuthService } from '../auth/auth.service';
import { API_ENDPOINTS } from '../../config/api.config';
import { AUTH_CONSTANTS } from '../../constants/auth.constants';

/** Maximum number of consecutive reconnect attempts before giving up. */
const MAX_RECONNECT_ATTEMPTS =
  AUTH_CONSTANTS.SIGNALR_RECONNECT_DELAYS_MS.length;

/**
 * Negotiate-based SignalR transport service.
 *
 * Lifecycle:
 * 1. Calls `/api/signalr/negotiate` (cookie-authenticated) for a short-lived token.
 * 2. Passes the token via `accessTokenFactory` to the `HubConnection`.
 * 3. Re-negotiates automatically on reconnect via `withAutomaticReconnect`.
 * 4. Caps reconnect attempts at {@link MAX_RECONNECT_ATTEMPTS} to avoid infinite loops.
 *
 * Consumers subscribe to the public `onXxx` observables for real-time events.
 */
@Injectable({ providedIn: 'root' })
export class SignalRService implements OnDestroy {
  private readonly api = inject(AuthApiService);
  private readonly auth = inject(AuthService);

  private connection: HubConnection | null = null;
  private reconnectAttempts = 0;

  /** Reactive connection status for UI binding. */
  readonly isConnected = signal(false);

  // ── Event streams (exposed as Observables) ──────────────────────────
  private readonly messageReceived$ = new Subject<unknown>();
  private readonly messageDelivered$ = new Subject<unknown>();
  private readonly messageRead$ = new Subject<unknown>();
  private readonly userOnline$ = new Subject<unknown>();
  private readonly userOffline$ = new Subject<unknown>();
  private readonly userTyping$ = new Subject<unknown>();
  private readonly userStoppedTyping$ = new Subject<unknown>();

  readonly onMessageReceived = this.messageReceived$.asObservable();
  readonly onMessageDelivered = this.messageDelivered$.asObservable();
  readonly onMessageRead = this.messageRead$.asObservable();
  readonly onUserOnline = this.userOnline$.asObservable();
  readonly onUserOffline = this.userOffline$.asObservable();
  readonly onUserTyping = this.userTyping$.asObservable();
  readonly onUserStoppedTyping = this.userStoppedTyping$.asObservable();

  ngOnDestroy(): void {
    void this.stopConnection();
    this.completeSubjects();
  }

  /**
   * Start the SignalR connection with negotiate-based token auth.
   *
   * Uses an iterative retry loop (not recursion) capped at
   * {@link MAX_RECONNECT_ATTEMPTS} to prevent stack overflow.
   */
  async startConnection(): Promise<void> {
    if (this.connection?.state === HubConnectionState.Connected) return;

    while (this.reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      try {
        await firstValueFrom(this.api.negotiate());

        this.connection = new HubConnectionBuilder()
          .withUrl(API_ENDPOINTS.SIGNALR.HUB, {
            accessTokenFactory: async () => {
              const resp = await firstValueFrom(this.api.negotiate());
              return resp.accessToken;
            },
          })
          .configureLogging(LogLevel.Warning)
          .withAutomaticReconnect(
            AUTH_CONSTANTS.SIGNALR_RECONNECT_DELAYS_MS as unknown as number[],
          )
          .build();

        this.registerHandlers();
        await this.connection.start();
        this.reconnectAttempts = 0;
        this.isConnected.set(true);
        return;
      } catch (err: unknown) {
        if (isHttpStatus(err, 401)) {
          this.auth.logout();
          return;
        }

        this.reconnectAttempts += 1;
        if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
          this.isConnected.set(false);
          throw new Error(
            `SignalR: failed to connect after ${MAX_RECONNECT_ATTEMPTS} attempts`,
          );
        }

        const delayIdx = Math.min(
          this.reconnectAttempts,
          AUTH_CONSTANTS.SIGNALR_RECONNECT_DELAYS_MS.length - 1,
        );
        await firstValueFrom(
          timer(AUTH_CONSTANTS.SIGNALR_RECONNECT_DELAYS_MS[delayIdx]),
        );
      }
    }
  }

  /** Send a chat message via the hub. Throws if not connected. */
  async sendMessage(receiverId: string, messageText: string): Promise<void> {
    this.assertConnected();
    await this.connection!.invoke('SendMessage', { receiverId, messageText });
  }

  /** Gracefully stop the connection and clean up handlers. */
  async stopConnection(): Promise<void> {
    if (!this.connection) return;
    try {
      await this.connection.stop();
    } finally {
      this.connection = null;
      this.isConnected.set(false);
    }
  }

  // ── Private ─────────────────────────────────────────────────────────

  private assertConnected(): void {
    if (
      !this.connection ||
      this.connection.state !== HubConnectionState.Connected
    ) {
      throw new Error('SignalR: connection not active');
    }
  }

  private registerHandlers(): void {
    if (!this.connection) return;

    const conn = this.connection;

    conn.on('MessageReceived', (p: unknown) => this.messageReceived$.next(p));
    conn.on('MessageDelivered', (p: unknown) => this.messageDelivered$.next(p));
    conn.on('MessageRead', (p: unknown) => this.messageRead$.next(p));
    conn.on('UserOnline', (p: unknown) => this.userOnline$.next(p));
    conn.on('UserOffline', (p: unknown) => this.userOffline$.next(p));
    conn.on('UserTyping', (p: unknown) => this.userTyping$.next(p));
    conn.on('UserStoppedTyping', (p: unknown) =>
      this.userStoppedTyping$.next(p),
    );

    conn.onreconnecting(() => {
      this.isConnected.set(false);
      this.reconnectAttempts += 1;
    });

    conn.onreconnected(() => {
      this.isConnected.set(true);
      this.reconnectAttempts = 0;
    });

    conn.onclose(() => {
      this.isConnected.set(false);
      // Automatic reconnect is managed by `withAutomaticReconnect`.
      // If the built-in reconnect also fails, the connection stays closed
      // and the consumer must call `startConnection()` again explicitly.
    });
  }

  private completeSubjects(): void {
    this.messageReceived$.complete();
    this.messageDelivered$.complete();
    this.messageRead$.complete();
    this.userOnline$.complete();
    this.userOffline$.complete();
    this.userTyping$.complete();
    this.userStoppedTyping$.complete();
  }
}

/** Type-safe check for HTTP-like error status codes. */
function isHttpStatus(err: unknown, status: number): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'status' in err &&
    (err as Record<string, unknown>)['status'] === status
  );
}
