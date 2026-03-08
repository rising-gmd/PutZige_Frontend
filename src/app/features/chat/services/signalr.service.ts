import { Injectable, signal, inject } from '@angular/core';
import {
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from '@microsoft/signalr';
import { Subject } from 'rxjs';
import { Message } from '../models/message.model';
import { UserStatus } from '../models/user.model';
import { Conversation } from '../models';
import { API_CONFIG, ApiConfig } from '../../../core/config/api.config';
import { SignalREvents, MessageSentPayload } from './signalr-events.constants';
import { TypedHubConnection } from './typed-hub.types';
import {
  mapReceiveMessagePayload,
  mapMessageDeliveredPayload,
  mapMessageEditedPayload,
  mapMessageReadPayload,
  mapMessageSentPayload,
  mapUserStatusPayload,
  mapTypingPayload,
  mapConversationCreatedPayload,
} from '../mappers';

@Injectable({ providedIn: 'root' })
export class SignalRService {
  private readonly apiConfig = inject(API_CONFIG, { optional: true }) as
    | ApiConfig
    | undefined;

  private hub?: TypedHubConnection;

  readonly isConnected = signal(false);
  readonly connectionId = signal<string | null>(null);

  //  Inbound event streams

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
  private readonly messageEdited$ = new Subject<{
    messageId: string;
    messageText: string;
    editedAt: Date;
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
  private readonly conversationCreated$ = new Subject<Conversation>();

  //  Connection lifecycle streams

  private readonly reconnecting$ = new Subject<void>();
  private readonly reconnected$ = new Subject<string | null>();
  private readonly disconnected$ = new Subject<void>();

  readonly onMessageReceived = this.messageReceived$.asObservable();
  readonly onMessageDelivered = this.messageDelivered$.asObservable();
  readonly onMessageRead = this.messageRead$.asObservable();
  readonly onMessageSent = this.messageSent$.asObservable();
  readonly onUserOnline = this.userOnline$.asObservable();
  readonly onUserOffline = this.userOffline$.asObservable();
  readonly onUserTyping = this.userTyping$.asObservable();
  readonly onUserStoppedTyping = this.userStoppedTyping$.asObservable();
  readonly onConversationCreated = this.conversationCreated$.asObservable();
  readonly onMessageEdited = this.messageEdited$.asObservable();
  /** Emits when the hub begins an automatic reconnect attempt. */
  readonly onReconnecting = this.reconnecting$.asObservable();
  /** Emits the new connectionId (or null) when the hub successfully reconnects. */
  readonly onReconnected = this.reconnected$.asObservable();
  /** Emits when the hub connection is permanently closed. */
  readonly onDisconnected = this.disconnected$.asObservable();

  //  Typed event handlers
  // Arrow-function class fields are bound to this and stored as refs so the
  // same reference is passed to both on() and off().

  private readonly handleReceiveMessage = (
    p: Parameters<typeof mapReceiveMessagePayload>[0],
  ) => {
    const msg = mapReceiveMessagePayload(p);
    if (msg) this.messageReceived$.next(msg);
  };

  private readonly handleMessageDelivered = (
    p: Parameters<typeof mapMessageDeliveredPayload>[0],
  ) => {
    const d = mapMessageDeliveredPayload(p);
    if (d) this.messageDelivered$.next(d);
  };

  private readonly handleMessageSent = (p: MessageSentPayload) => {
    const payload = mapMessageSentPayload(p);
    if (payload) this.messageSent$.next(payload);
  };

  private readonly handleMessageRead = (
    p: Parameters<typeof mapMessageReadPayload>[0],
  ) => {
    const r = mapMessageReadPayload(p);
    if (r) this.messageRead$.next(r);
  };

  private readonly handleMessageEdited = (
    p: Parameters<typeof mapMessageEditedPayload>[0],
  ) => {
    const d = mapMessageEditedPayload(p);
    if (d) this.messageEdited$.next(d);
  };

  private readonly handleUserOnline = (
    p: Parameters<typeof mapUserStatusPayload>[0],
  ) => {
    const status = mapUserStatusPayload(p, true);
    if (status) this.userOnline$.next(status);
  };

  private readonly handleUserOffline = (
    p: Parameters<typeof mapUserStatusPayload>[0],
  ) => {
    const status = mapUserStatusPayload(p, false);
    if (status) this.userOffline$.next(status);
  };

  private readonly handleUserTyping = (
    p: Parameters<typeof mapTypingPayload>[0],
  ) => {
    const typing = mapTypingPayload(p);
    if (typing) this.userTyping$.next(typing);
  };

  private readonly handleUserStoppedTyping = (
    p: Parameters<typeof mapTypingPayload>[0],
  ) => {
    const typing = mapTypingPayload(p);
    if (typing) this.userStoppedTyping$.next(typing);
  };

  private readonly handleConversationCreated = (
    p: Parameters<typeof mapConversationCreatedPayload>[0],
  ) => {
    const conv = mapConversationCreatedPayload(p);
    if (conv) this.conversationCreated$.next(conv);
  };

  //  Connection lifecycle

  async startConnection(): Promise<void> {
    if (this.hub?.state === HubConnectionState.Connected) return;

    // Tests that omit the API_CONFIG token skip hub setup.
    if (!this.apiConfig) return;

    const hubUrl = `${this.apiConfig.baseUrl}/api/${this.apiConfig.version}/hubs/chat`;

    const rawHub = new HubConnectionBuilder()
      .withUrl(hubUrl, { withCredentials: true })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(LogLevel.Information)
      .build();

    this.hub = new TypedHubConnection(rawHub);
    this.registerEventHandlers();
    this.registerConnectionHandlers();

    try {
      await this.hub.start();
      this.isConnected.set(true);
      this.connectionId.set(this.hub.connectionId ?? null);
    } catch (err) {
      this.isConnected.set(false);
      throw err;
    }
  }

  async stopConnection(): Promise<void> {
    this.unregisterEventHandlers();
    try {
      await this.hub?.stop();
    } finally {
      this.isConnected.set(false);
      this.connectionId.set(null);
      this.hub = undefined;
    }
  }

  /**
   * Send a message via the hub.
   * @param tempId Client-generated id echoed back by the server in its ACK
   *               for optimistic-message reconciliation.
   */
  async sendMessage(
    conversationId: string,
    messageText: string,
    tempId?: string,
  ): Promise<void> {
    if (this.hub?.state !== HubConnectionState.Connected) {
      throw new Error('SignalR not connected');
    }
    await this.hub.invoke('SendMessage', conversationId, messageText, tempId);
  }

  async notifyTyping(conversationId: string, isTyping: boolean): Promise<void> {
    if (this.hub?.state !== HubConnectionState.Connected) return;
    await this.hub.invoke(
      isTyping ? 'StartTyping' : 'StopTyping',
      conversationId,
    );
  }

  //  Private helpers

  private registerEventHandlers(): void {
    if (!this.hub) return;
    this.hub.on(SignalREvents.ReceiveMessage, this.handleReceiveMessage);
    this.hub.on(SignalREvents.MessageDelivered, this.handleMessageDelivered);
    this.hub.on(SignalREvents.MessageSent, this.handleMessageSent);
    this.hub.on(SignalREvents.MessageRead, this.handleMessageRead);
    this.hub.on(SignalREvents.MessageEdited, this.handleMessageEdited);
    this.hub.on(SignalREvents.UserOnline, this.handleUserOnline);
    this.hub.on(SignalREvents.UserOffline, this.handleUserOffline);
    this.hub.on(SignalREvents.UserTyping, this.handleUserTyping);
    this.hub.on(SignalREvents.UserStoppedTyping, this.handleUserStoppedTyping);
    this.hub.on(
      SignalREvents.ConversationCreated,
      this.handleConversationCreated,
    );
  }

  private unregisterEventHandlers(): void {
    if (!this.hub) return;
    this.hub.off(SignalREvents.ReceiveMessage, this.handleReceiveMessage);
    this.hub.off(SignalREvents.MessageDelivered, this.handleMessageDelivered);
    this.hub.off(SignalREvents.MessageSent, this.handleMessageSent);
    this.hub.off(SignalREvents.MessageRead, this.handleMessageRead);
    this.hub.off(SignalREvents.MessageEdited, this.handleMessageEdited);
    this.hub.off(SignalREvents.UserOnline, this.handleUserOnline);
    this.hub.off(SignalREvents.UserOffline, this.handleUserOffline);
    this.hub.off(SignalREvents.UserTyping, this.handleUserTyping);
    this.hub.off(SignalREvents.UserStoppedTyping, this.handleUserStoppedTyping);
    this.hub.off(
      SignalREvents.ConversationCreated,
      this.handleConversationCreated,
    );
  }

  private registerConnectionHandlers(): void {
    if (!this.hub) return;

    this.hub.onreconnecting(() => {
      this.isConnected.set(false);
      this.reconnecting$.next();
    });

    this.hub.onreconnected((id) => {
      this.isConnected.set(true);
      this.connectionId.set(id ?? null);
      this.reconnected$.next(id ?? null);
    });

    this.hub.onclose(() => {
      this.isConnected.set(false);
      this.connectionId.set(null);
      this.disconnected$.next();
    });
  }
}
