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
import { parseDate } from '../../../core/utils/date.util';
import { MessageSentPayload, SignalREvents } from './signalr-events.constants';

@Injectable({ providedIn: 'root' })
export class SignalRService {
  // API config may not be provided in some tests; make injection optional to
  // avoid breaking TestBed setups that don't provide the token.
  private readonly apiConfig = inject(API_CONFIG, { optional: true }) as
    | ApiConfig
    | undefined;
  private hubConnection?: HubConnection;
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
  private readonly messageSent$ = new Subject<MessageSentPayload>();
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
  readonly onMessageSent = this.messageSent$.asObservable();
  readonly onUserOnline = this.userOnline$.asObservable();
  readonly onUserOffline = this.userOffline$.asObservable();
  readonly onUserTyping = this.userTyping$.asObservable();
  readonly onUserStoppedTyping = this.userStoppedTyping$.asObservable();

  async startConnection(): Promise<void> {
    if (this.hubConnection?.state === HubConnectionState.Connected) return;

    if (!this.apiConfig) {
      // In unit tests the API config is often not provided. Fail fast by
      // warning and skipping connection setup rather than throwing.
      console.warn('[SignalR] API config not provided — skipping connection');
      return;
    }

    const hubUrl = `${this.apiConfig.baseUrl}/api/${this.apiConfig.version}/hubs/chat`;

    const builder = new HubConnectionBuilder()
      .withUrl(hubUrl, {
        withCredentials: true,
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(LogLevel.Information);

    this.hubConnection = builder.build();

    this.registerEventHandlers();
    this.registerConnectionHandlers();

    try {
      await this.hubConnection.start();
      this.isConnected.set(true);
      this.connectionId.set(this.hubConnection.connectionId ?? null);
      console.log('[SignalR] Connected:', this.hubConnection.connectionId);
    } catch (err) {
      this.isConnected.set(false);
      console.error('[SignalR] Connection failed:', err);
      throw err;
    }
  }

  async stopConnection(): Promise<void> {
    this.unregisterEventHandlers();

    try {
      await this.hubConnection?.stop();
    } finally {
      this.isConnected.set(false);
      this.connectionId.set(null);
      this.hubConnection = undefined;
    }
  }

  async sendMessage(
    conversationId: string,
    messageText: string,
  ): Promise<void> {
    if (
      !this.hubConnection ||
      this.hubConnection.state !== HubConnectionState.Connected
    ) {
      throw new Error('SignalR not connected');
    }

    await this.hubConnection.invoke('SendMessage', conversationId, messageText);
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
      this.hubConnection!.on(event, handler);
      this.eventHandlers.push({ event, handler });
    };

    register(SignalREvents.ReceiveMessage, (payload: unknown) => {
      const msg = this.parseMessage(payload);
      if (msg) this.messageReceived$.next(msg);
    });

    register(SignalREvents.MessageDelivered, (payload: unknown) => {
      const p = this.parseDelivered(payload);
      if (p) this.messageDelivered$.next(p);
    });

    register(SignalREvents.MessageSent, (payload: unknown) => {
      console.log('[SignalR] MessageSent:', payload);
      const p = this.parseMessageSent(payload);
      if (p) this.messageSent$.next(p);
    });

    register(SignalREvents.MessageRead, (payload: unknown) => {
      const p = this.parseRead(payload);
      if (p) this.messageRead$.next(p);
    });

    register(SignalREvents.UserOnline, (status: unknown) => {
      const s = this.parseUserStatus(status, true);
      if (s) this.userOnline$.next(s);
    });

    register(SignalREvents.UserOffline, (status: unknown) => {
      const s = this.parseUserStatus(status, false);
      if (s) this.userOffline$.next(s);
    });

    register(SignalREvents.UserTyping, (payload: unknown) => {
      const t = this.parseTyping(payload);
      if (t) this.userTyping$.next(t);
    });

    register(SignalREvents.UserStoppedTyping, (payload: unknown) => {
      const t = this.parseTyping(payload);
      if (t) this.userStoppedTyping$.next(t);
    });

    register(SignalREvents.Error, (err: unknown) => {
      const message = extractErrorMessage(err);
      console.error('[SignalR] Server error:', message);
    });
  }

  private unregisterEventHandlers(): void {
    if (!this.hubConnection) {
      this.eventHandlers = [];
      return;
    }

    for (const { event, handler } of this.eventHandlers) {
      try {
        this.hubConnection.off(event, handler);
      } catch {
        // ignore
      }
    }

    this.eventHandlers = [];
  }

  private parseMessage(payload: unknown): Message | null {
    if (!payload || typeof payload !== 'object') return null;
    const p = payload as Record<string, unknown>;

    const id = p['id'];
    const senderId = p['senderId'];
    const receiverId = p['receiverId'];
    const messageText = p['messageText'];
    const sentAtValue = p['sentAt'];
    const deliveredAtValue = p['deliveredAt'];
    const readAtValue = p['readAt'];
    const conversationId = p['conversationId'];

    if (typeof id !== 'string') return null;
    if (typeof senderId !== 'string') return null;
    if (typeof receiverId !== 'string') return null;
    if (typeof messageText !== 'string') return null;

    const parsedSent = parseDate(sentAtValue);
    const sentAt = parsedSent ?? new Date();
    const deliveredAt = parseDate(deliveredAtValue) ?? undefined;
    const readAt = parseDate(readAtValue) ?? undefined;
    const conversationIdStr =
      typeof conversationId === 'string' ? conversationId : undefined;

    return {
      id,
      senderId,
      receiverId,
      messageText,
      sentAt,
      deliveredAt,
      readAt,
      conversationId: conversationIdStr,
    };
  }

  private parseDelivered(
    payload: unknown,
  ): { messageId: string; deliveredAt: Date } | null {
    if (!payload || typeof payload !== 'object') return null;
    const p = payload as Record<string, unknown>;

    const messageId = p['messageId'];
    const deliveredAtValue = p['deliveredAt'];

    if (typeof messageId !== 'string') return null;

    let deliveredAt: Date;
    if (typeof deliveredAtValue === 'string') {
      deliveredAt = new Date(deliveredAtValue);
    } else if (deliveredAtValue instanceof Date) {
      deliveredAt = deliveredAtValue;
    } else {
      return null;
    }

    return { messageId, deliveredAt };
  }

  private parseRead(
    payload: unknown,
  ): { messageId: string; readAt: Date } | null {
    if (!payload || typeof payload !== 'object') return null;
    const p = payload as Record<string, unknown>;

    const messageId = p['messageId'];
    const readAtValue = p['readAt'];

    if (typeof messageId !== 'string') return null;

    let readAt: Date;
    if (typeof readAtValue === 'string') {
      readAt = new Date(readAtValue);
    } else if (readAtValue instanceof Date) {
      readAt = readAtValue;
    } else {
      return null;
    }

    return { messageId, readAt };
  }

  private parseUserStatus(
    payload: unknown,
    isOnline: boolean,
  ): UserStatus | null {
    if (!payload || typeof payload !== 'object') return null;
    const p = payload as Record<string, unknown>;

    const userIdValue = p['userId'];
    const lastSeenValue = p['lastSeen'];

    if (typeof userIdValue !== 'string') return null;

    const userId = userIdValue;
    const lastSeen = parseDate(lastSeenValue) ?? undefined;

    return { userId, isOnline, lastSeen };
  }

  private parseTyping(
    payload: unknown,
  ): { userId: string; conversationId: string } | null {
    if (!payload || typeof payload !== 'object') return null;
    const p = payload as Record<string, unknown>;

    const userIdValue = p['userId'];
    const conversationIdValue = p['conversationId'];

    if (
      typeof userIdValue !== 'string' ||
      typeof conversationIdValue !== 'string'
    )
      return null;

    return { userId: userIdValue, conversationId: conversationIdValue };
  }

  private parseMessageSent(payload: unknown): MessageSentPayload | null {
    if (!payload || typeof payload !== 'object') return null;
    const p = payload as Record<string, unknown>;

    const conversationId = p['conversationId'];
    const messageId = p['messageId'];
    const senderId = p['senderId'];
    const receiverId = p['receiverId'];
    const messageText = p['messageText'];
    const sentAt = p['sentAt'];

    if (
      typeof conversationId !== 'string' ||
      typeof messageId !== 'string' ||
      typeof senderId !== 'string' ||
      typeof receiverId !== 'string' ||
      typeof messageText !== 'string'
    )
      return null;

    return {
      conversationId,
      messageId,
      senderId,
      receiverId,
      messageText,
      sentAt: sentAt as string | Date,
    };
  }

  private registerConnectionHandlers(): void {
    if (!this.hubConnection) return;

    this.hubConnection.onreconnecting(() => {
      console.log('[SignalR] Reconnecting...');
      this.isConnected.set(false);
    });

    this.hubConnection.onreconnected((connectionId) => {
      console.log('[SignalR] Reconnected:', connectionId);
      this.isConnected.set(true);
      this.connectionId.set(connectionId ?? null);
    });

    this.hubConnection.onclose(() => {
      console.log('[SignalR] Connection closed');
      this.isConnected.set(false);
      this.connectionId.set(null);
    });
  }

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

function extractErrorMessage(err: unknown): string {
  return SignalRService['extractErrorMessageLocal'](err);
}
