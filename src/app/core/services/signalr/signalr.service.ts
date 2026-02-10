import { Injectable, inject } from '@angular/core';
import {
  HubConnection,
  HubConnectionBuilder,
  LogLevel,
} from '@microsoft/signalr';
import { Subject, timer, firstValueFrom } from 'rxjs';
import { AuthApiService } from '../../../features/auth/services/auth-api.service';
import { AuthService } from '../auth/auth.service';
import { API_ENDPOINTS } from '../../config/api.config';
import { AUTH_CONSTANTS } from '../../constants/auth.constants';

/**
 * SignalRService implements Option A (negotiate token):
 * - Calls `/api/signalr/negotiate` (authenticated via cookie) to receive a
 *   short-lived connection token
 * - Uses token in `accessTokenFactory` for the HubConnection
 * - Re-negotiate on reconnect attempts
 */
@Injectable({ providedIn: 'root' })
export class SignalRService {
  private connection: HubConnection | null = null;
  private readonly api = inject(AuthApiService);
  private readonly auth = inject(AuthService);

  // Public event subjects used by ChatStateService
  readonly onMessageReceived = new Subject<unknown>();
  readonly onMessageDelivered = new Subject<unknown>();
  readonly onMessageRead = new Subject<unknown>();
  readonly onUserOnline = new Subject<unknown>();
  readonly onUserOffline = new Subject<unknown>();
  readonly onUserTyping = new Subject<unknown>();
  readonly onUserStoppedTyping = new Subject<unknown>();

  private reconnectAttempts = 0;

  /** Start the SignalR connection. Negotiates a short-lived token first. */
  async startConnection(): Promise<void> {
    // If already connected, no-op
    if (this.connection && this.connection.state === 'Connected') return;

    try {
      // initial negotiate call to ensure server accepts cookie and can issue a token
      await firstValueFrom(this.api.negotiate());

      this.connection = new HubConnectionBuilder()
        .withUrl(API_ENDPOINTS.SIGNALR.HUB, {
          accessTokenFactory: async () => {
            // Always request a fresh short-lived token when SignalR needs it
            const resp = await firstValueFrom(this.api.negotiate());
            return resp.accessToken;
          },
          // credentials are handled by negotiate — ensure cookies are sent for negotiate
        })
        .configureLogging(LogLevel.Warning)
        .withAutomaticReconnect()
        .build();

      this.registerHandlers();

      await this.connection.start();
      this.reconnectAttempts = 0;
    } catch (err: unknown) {
      // If auth problem, force a logout via AuthService
      const maybe = err as { status?: number };
      if (maybe && maybe.status === 401) {
        this.auth.logout();
      }
      // Exponential backoff for retries using configured delays
      this.reconnectAttempts += 1;
      const idx = Math.min(
        this.reconnectAttempts,
        AUTH_CONSTANTS.SIGNALR_RECONNECT_DELAYS_MS.length - 1,
      );
      const backoffMs = AUTH_CONSTANTS.SIGNALR_RECONNECT_DELAYS_MS[idx];
      await firstValueFrom(timer(backoffMs));
      return this.startConnection();
    }
  }

  /** Send a chat message via SignalR */
  async sendMessage(receiverId: string, messageText: string): Promise<void> {
    if (!this.connection)
      throw new Error('SignalR: connection not initialized');
    await this.connection.invoke('SendMessage', { receiverId, messageText });
  }

  stopConnection(): Promise<void> {
    if (!this.connection) return Promise.resolve();
    return this.connection.stop().then(() => void (this.connection = null));
  }

  private registerHandlers(): void {
    if (!this.connection) return;

    this.connection.on('MessageReceived', (payload: unknown) =>
      this.onMessageReceived.next(payload),
    );
    this.connection.on('MessageDelivered', (payload: unknown) =>
      this.onMessageDelivered.next(payload),
    );
    this.connection.on('MessageRead', (payload: unknown) =>
      this.onMessageRead.next(payload),
    );
    this.connection.on('UserOnline', (payload: unknown) =>
      this.onUserOnline.next(payload),
    );
    this.connection.on('UserOffline', (payload: unknown) =>
      this.onUserOffline.next(payload),
    );
    this.connection.on('UserTyping', (payload: unknown) =>
      this.onUserTyping.next(payload),
    );
    this.connection.on('UserStoppedTyping', (payload: unknown) =>
      this.onUserStoppedTyping.next(payload),
    );

    this.connection.onreconnecting(() => {
      // Signal reconnection attempt — increment counter
      this.reconnectAttempts += 1;
    });

    this.connection.onreconnected(async () => {
      // On reconnected, reset attempts
      this.reconnectAttempts = 0;
    });

    this.connection.onclose(async () => {
      // On close, attempt a reconnect with backoff using configured delays
      this.reconnectAttempts += 1;
      const idx = Math.min(
        this.reconnectAttempts,
        AUTH_CONSTANTS.SIGNALR_RECONNECT_DELAYS_MS.length - 1,
      );
      const backoffMs = AUTH_CONSTANTS.SIGNALR_RECONNECT_DELAYS_MS[idx];
      await firstValueFrom(timer(backoffMs));
      await this.startConnection();
    });
  }
}
