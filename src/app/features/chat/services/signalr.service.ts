import { Injectable, signal, inject } from '@angular/core';
import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from '@microsoft/signalr';
import { Subject } from 'rxjs';
import { Message } from '../models/message.model';
import { UserStatus } from '../models/user.model';
import { API_CONFIG, ApiConfig } from '../../../core/config/api.config';

export interface SignalREvents {
  ReceiveMessage: Message;
  MessageDelivered: { messageId: string; deliveredAt: string };
  MessageRead: { messageId: string; readAt: string };
  UserOnline: UserStatus;
  UserOffline: UserStatus;
  UserTyping: { userId: string; conversationId: string };
  UserStoppedTyping: { userId: string; conversationId: string };
  Error: { message: string };
}

@Injectable({ providedIn: 'root' })
export class SignalRService {
  private readonly apiConfig = inject(API_CONFIG) as ApiConfig;
  private hubConnection?: HubConnection;
  private accessTokenFactory?: () => Promise<string>;
  private eventHandlers: {
    event: string;
    handler: (...args: unknown[]) => void;
  }[] = [];

  readonly isConnected = signal(false);
  readonly connectionId = signal<string | null>(null);

  private readonly messageReceived$ = new Subject<Message>();
  private readonly messageDelivered$ = new Subject<{
    messageId: string;
    deliveredAt: Date;
  }>();
  private readonly messageRead$ = new Subject<{
    messageId: string;
    readAt: Date;
  }>();
  private readonly userOnline$ = new Subject<UserStatus>();
  private readonly userOffline$ = new Subject<UserStatus>();
  private readonly userTyping$ = new Subject<{
    userId: string;
    conversationId: string;
  }>();
  private readonly userStoppedTyping$ = new Subject<{
    userId: string;
    conversationId: string;
  }>();

  readonly onMessageReceived = this.messageReceived$.asObservable();
  readonly onMessageDelivered = this.messageDelivered$.asObservable();
  readonly onMessageRead = this.messageRead$.asObservable();
  readonly onUserOnline = this.userOnline$.asObservable();
  readonly onUserOffline = this.userOffline$.asObservable();
  readonly onUserTyping = this.userTyping$.asObservable();
  readonly onUserStoppedTyping = this.userStoppedTyping$.asObservable();

  /** Start SignalR connection with an optional token factory used for refresh on reconnect */
  async startConnection(tokenFactory?: () => Promise<string>): Promise<void> {
    // accept optional tokenFactory for callers that don't have one
    this.accessTokenFactory = tokenFactory;

    if (this.hubConnection?.state === HubConnectionState.Connected) return;

    const hubUrl = `${this.apiConfig.baseUrl}/api/${this.apiConfig.version}/hubs/chat`;

    const builder = new HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: async () => {
          try {
            const t = await this.accessTokenFactory?.();
            return t ?? '';
          } catch {
            return '';
          }
        },
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning);

    this.hubConnection = builder.build();

    this.registerEventHandlers();
    this.registerConnectionHandlers();

    try {
      await this.hubConnection.start();
      this.isConnected.set(true);
      this.connectionId.set(this.hubConnection.connectionId ?? null);
    } catch (err) {
      this.isConnected.set(false);
      throw err;
    }
  }

  async stopConnection(): Promise<void> {
    // remove any registered handlers to avoid leaks
    this.unregisterEventHandlers();

    try {
      await this.hubConnection?.stop();
    } finally {
      this.isConnected.set(false);
      this.connectionId.set(null);
      this.hubConnection = undefined;
    }
  }

  async sendMessage(receiverId: string, messageText: string): Promise<void> {
    if (
      !this.hubConnection ||
      this.hubConnection.state !== HubConnectionState.Connected
    ) {
      throw new Error('SignalR not connected');
    }

    await this.hubConnection.invoke('SendMessage', receiverId, messageText);
  }

  async notifyTyping(conversationId: string, isTyping: boolean): Promise<void> {
    if (
      !this.hubConnection ||
      this.hubConnection.state !== HubConnectionState.Connected
    )
      return;
    const method = isTyping ? 'StartTyping' : 'StopTyping';
    await this.hubConnection.invoke(method, conversationId);
  }

  private registerEventHandlers(): void {
    if (!this.hubConnection) return;

    this.unregisterEventHandlers();

    const register = (event: string, handler: (...args: unknown[]) => void) => {
      this.hubConnection!.on(
        event,
        handler as unknown as (...args: unknown[]) => void,
      );
      this.eventHandlers.push({ event, handler });
    };

    register('ReceiveMessage', (payload: unknown) => {
      const msg = this.parseMessage(payload);
      if (msg) this.messageReceived$.next(msg);
    });

    register('MessageDelivered', (payload: unknown) => {
      const p = this.parseDelivered(payload);
      if (p) this.messageDelivered$.next(p);
    });

    register('MessageRead', (payload: unknown) => {
      const p = this.parseRead(payload);
      if (p) this.messageRead$.next(p);
    });

    register('UserOnline', (status: unknown) => {
      const s = this.parseUserStatus(status, true);
      if (s) this.userOnline$.next(s);
    });

    register('UserOffline', (status: unknown) => {
      const s = this.parseUserStatus(status, false);
      if (s) this.userOffline$.next(s);
    });

    register('UserTyping', (payload: unknown) => {
      const t = this.parseTyping(payload);
      if (t) this.userTyping$.next(t);
    });

    register('UserStoppedTyping', (payload: unknown) => {
      const t = this.parseTyping(payload);
      if (t) this.userStoppedTyping$.next(t);
    });

    register('Error', (err: unknown) => {
      const message = extractErrorMessage(err);
      console.error('SignalR server error', message);
    });
  }

  private unregisterEventHandlers(): void {
    if (!this.hubConnection) {
      this.eventHandlers = [];
      return;
    }

    for (const { event, handler } of this.eventHandlers) {
      try {
        this.hubConnection.off(
          event,
          handler as unknown as (...args: unknown[]) => void,
        );
      } catch {
        // ignore
      }
    }

    this.eventHandlers = [];
  }

  private parseMessage(payload: unknown): Message | null {
    if (!payload || typeof payload !== 'object') return null;
    const p = payload as Record<string, unknown>;

    // Strict validation of required fields
    if (typeof p['id'] !== 'string') return null;
    if (typeof p['senderId'] !== 'string') return null;
    if (typeof p['receiverId'] !== 'string') return null;
    if (typeof p['messageText'] !== 'string') return null;

    const id = p['id'];
    const senderId = p['senderId'];
    const receiverId = p['receiverId'];
    const messageText = p['messageText'];

    // Parse sentAt with fallback
    let sentAt: Date;
    if (typeof p['sentAt'] === 'string') {
      sentAt = new Date(p['sentAt']);
    } else if (p['sentAt'] instanceof Date) {
      sentAt = p['sentAt'];
    } else {
      sentAt = new Date();
    }

    const deliveredAt =
      typeof p['deliveredAt'] === 'string'
        ? new Date(p['deliveredAt'])
        : undefined;
    const readAt =
      typeof p['readAt'] === 'string' ? new Date(p['readAt']) : undefined;
    const conversationId =
      typeof p['conversationId'] === 'string' ? p['conversationId'] : undefined;

    return {
      id,
      senderId,
      receiverId,
      messageText,
      sentAt,
      deliveredAt,
      readAt,
      conversationId,
    };
  }

  private parseDelivered(
    payload: unknown,
  ): { messageId: string; deliveredAt: Date } | null {
    if (!payload || typeof payload !== 'object') return null;
    const p = payload as Record<string, unknown>;
    if (typeof p['messageId'] !== 'string') return null;

    let deliveredAt: Date;
    if (typeof p['deliveredAt'] === 'string') {
      deliveredAt = new Date(p['deliveredAt']);
    } else if (p['deliveredAt'] instanceof Date) {
      deliveredAt = p['deliveredAt'];
    } else {
      return null;
    }

    return { messageId: p['messageId'], deliveredAt };
  }

  private parseRead(
    payload: unknown,
  ): { messageId: string; readAt: Date } | null {
    if (!payload || typeof payload !== 'object') return null;
    const p = payload as Record<string, unknown>;
    if (typeof p['messageId'] !== 'string') return null;

    let readAt: Date;
    if (typeof p['readAt'] === 'string') {
      readAt = new Date(p['readAt']);
    } else if (p['readAt'] instanceof Date) {
      readAt = p['readAt'];
    } else {
      return null;
    }

    return { messageId: p['messageId'], readAt };
  }

  private parseUserStatus(
    payload: unknown,
    isOnline: boolean,
  ): UserStatus | null {
    if (!payload || typeof payload !== 'object') return null;
    const p = payload as Record<string, unknown>;
    if (typeof p['userId'] !== 'string') return null;

    const userId = p['userId'];
    const lastSeen =
      typeof p['lastSeen'] === 'string' ? new Date(p['lastSeen']) : undefined;

    return { userId, isOnline, lastSeen };
  }

  private parseTyping(
    payload: unknown,
  ): { userId: string; conversationId: string } | null {
    if (!payload || typeof payload !== 'object') return null;
    const p = payload as Record<string, unknown>;
    if (
      typeof p['userId'] !== 'string' ||
      typeof p['conversationId'] !== 'string'
    )
      return null;

    return { userId: p['userId'], conversationId: p['conversationId'] };
  }

  private registerConnectionHandlers(): void {
    if (!this.hubConnection) return;
    this.hubConnection.onreconnecting(() => {
      this.isConnected.set(false);
    });

    this.hubConnection.onreconnected((connectionId) => {
      this.isConnected.set(true);
      this.connectionId.set(connectionId ?? null);
      console.log('SignalR reconnected', connectionId);
    });

    this.hubConnection.onclose(() => {
      this.isConnected.set(false);
      this.connectionId.set(null);
      // automatic reconnect is enabled; server-side token refresh is handled by accessTokenFactory
    });
  }

  // Small helper to safely extract error messages from unknown values
  private static extractErrorMessageLocal(err: unknown): string {
    if (!err) return String(err);
    if (typeof err === 'string') return err;
    if (typeof err === 'object') {
      const e = err as Record<string, unknown>;
      if (typeof e['message'] === 'string') return e['message'];
    }
    try {
      return String(err);
    } catch {
      return 'Unknown error';
    }
  }
}

// exported helper used above (keeps function name short in handlers)
function extractErrorMessage(err: unknown): string {
  return SignalRService['extractErrorMessageLocal'](err);
}
