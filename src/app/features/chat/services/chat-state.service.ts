import {
  Injectable,
  inject,
  computed,
  signal,
  DestroyRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  Subject,
  debounceTime,
  distinctUntilChanged,
  firstValueFrom,
  switchMap,
  of,
  catchError,
  EMPTY,
} from 'rxjs';
import { UI_CONSTANTS } from '../../../core/constants/ui.constants';
import { extractErrorMessage } from '../../../core/utils/error.util';
import { ChatApiService } from './chat-api.service';
import { SignalRService } from './signalr.service';
import { Conversation, Message, User, MessageDto } from '../models';
import { NotificationService } from '../../../shared/services/notification.service';

/**
 * Central chat state manager.
 *
 * Owns all reactive state (signals) consumed by chat UI components and
 * orchestrates API calls, SignalR event processing, optimistic updates,
 * and user search.
 *
 * Design decisions:
 * - Signals over BehaviorSubjects for synchronous, glitch-free reads.
 * - `DestroyRef` + `takeUntilDestroyed` for automatic subscription cleanup.
 * - `firstValueFrom` for all async methods so callers can properly `await`.
 * - Optimistic messaging with reconciliation on server ack.
 */
@Injectable({ providedIn: 'root' })
export class ChatStateService {
  private readonly api = inject(ChatApiService);
  private readonly signalR = inject(SignalRService);
  private readonly notification = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  // ── State signals ───────────────────────────────────────────────────
  readonly currentUser = signal<User | null>(null);
  readonly conversations = signal<Conversation[]>([]);
  readonly activeConversationId = signal<string | null>(null);
  readonly messages = signal<Record<string, Message[]>>({});

  readonly isLoadingConversations = signal(false);
  readonly isLoadingMessages = signal(false);
  readonly isSendingMessage = signal(false);

  readonly error = signal<string | null>(null);

  private readonly searchQuery$ = new Subject<string>();
  readonly searchResults = signal<User[]>([]);

  // ── Computed (derived, memoized) ────────────────────────────────────
  readonly activeConversation = computed(() => {
    const id = this.activeConversationId();
    return id
      ? (this.conversations().find((c) => c.userId === id) ?? null)
      : null;
  });

  readonly activeMessages = computed(() => {
    const id = this.activeConversationId();
    return id ? (this.messages()[id] ?? []) : [];
  });

  readonly totalUnreadCount = computed(() =>
    this.conversations().reduce((sum, c) => sum + c.unreadCount, 0),
  );

  readonly sortedConversations = computed(() =>
    [...this.conversations()].sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      return (
        new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
      );
    }),
  );

  constructor() {
    this.setupSignalRListeners();
    this.setupSearchDebounce();
  }

  // ── Public API ──────────────────────────────────────────────────────

  /** Bootstrap chat: load user, conversations, and open the SignalR channel. */
  async initialize(): Promise<void> {
    this.error.set(null);
    try {
      const user = await firstValueFrom(this.api.getCurrentUser());
      this.currentUser.set(user);
      await this.loadConversations();
      await this.signalR.startConnection();
    } catch (err: unknown) {
      const msg = extractErrorMessage(err);
      this.error.set(msg);
      this.notification.showError(msg);
      throw err;
    }
  }

  /** Fetch conversations from API. Properly awaitable unlike subscribe-based patterns. */
  async loadConversations(refresh = false): Promise<void> {
    this.isLoadingConversations.set(true);
    this.error.set(null);
    try {
      const convs = await firstValueFrom(this.api.getConversations(refresh));
      this.conversations.set(convs);
    } catch (err: unknown) {
      this.error.set(extractErrorMessage(err));
    } finally {
      this.isLoadingConversations.set(false);
    }
  }

  /** Activate a conversation, loading its messages if not already cached. */
  async setActiveConversation(conversationId: string): Promise<void> {
    this.activeConversationId.set(conversationId);
    if (!this.messages()[conversationId]) {
      await this.loadMessages(conversationId);
    }
    await this.markConversationAsRead(conversationId);
  }

  /** Load paginated message history for a conversation. */
  async loadMessages(conversationId: string, pageNumber = 1): Promise<void> {
    this.isLoadingMessages.set(true);
    this.error.set(null);
    try {
      const response = await firstValueFrom(
        this.api.getConversationHistory(
          conversationId,
          pageNumber,
          UI_CONSTANTS.CONVERSATION_PAGE_SIZE,
        ),
      );
      const mapped = (response.messages ?? []).map((m) => mapDtoToMessage(m));
      this.messages.update((msgs) => ({ ...msgs, [conversationId]: mapped }));
    } catch (err: unknown) {
      this.error.set(extractErrorMessage(err));
    } finally {
      this.isLoadingMessages.set(false);
    }
  }

  /**
   * Send a message with optimistic UI.
   *
   * Strategy:
   * 1. Insert an optimistic message immediately.
   * 2. Attempt delivery via SignalR (preferred, real-time).
   * 3. Fall back to REST on SignalR failure.
   * 4. Reconcile or rollback the optimistic entry.
   */
  async sendMessage(receiverId: string, messageText: string): Promise<void> {
    const user = this.currentUser();
    if (!user) throw new Error('User not authenticated');

    const tempId = `temp-${Date.now()}`;
    const conversationId = this.getOrCreateConversationIdForUser(receiverId);

    const optimisticMessage: Message = {
      id: tempId,
      senderId: user.id,
      receiverId,
      messageText,
      sentAt: new Date(),
      isOptimistic: true,
      conversationId,
    };

    this.addMessageToConversation(conversationId, optimisticMessage);
    this.isSendingMessage.set(true);

    try {
      await this.signalR.sendMessage(receiverId, messageText);
    } catch {
      // SignalR unavailable — fall back to REST
      try {
        const dto = await firstValueFrom(
          this.api.sendMessage({ receiverId, messageText }),
        );
        const realMessage: Message = {
          id: dto.messageId,
          senderId: dto.senderId,
          receiverId: dto.receiverId,
          messageText: dto.messageText,
          sentAt: new Date(dto.sentAt),
          conversationId,
        };
        this.replaceOptimisticMessage(conversationId, tempId, realMessage);
      } catch (apiErr: unknown) {
        this.removeOptimisticMessage(conversationId, tempId);
        const msg = extractErrorMessage(apiErr);
        this.notification.showError(msg);
        throw apiErr;
      }
    } finally {
      this.isSendingMessage.set(false);
    }
  }

  /** Emit a search query (debounced internally). */
  searchUsers(query: string): void {
    this.searchQuery$.next(query);
  }

  /** Open or create a conversation with the given user. */
  startConversation(user: User): void {
    const existing = this.conversations().find((c) => c.userId === user.id);
    if (existing) {
      void this.setActiveConversation(existing.userId);
      return;
    }

    const newConversation: Conversation = {
      userId: user.id,
      username: user.username,
      displayName: user.displayName,
      profilePictureUrl: user.profilePictureUrl,
      isOnline: user.isOnline,
      unreadCount: 0,
      isPinned: false,
      lastActivity: new Date().toISOString(),
      isTyping: false,
    };

    this.conversations.update((convs) => [newConversation, ...convs]);
    void this.setActiveConversation(newConversation.userId);
  }

  // ── SignalR event wiring ────────────────────────────────────────────

  private setupSignalRListeners(): void {
    this.signalR.onMessageReceived
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((message) => this.handleIncomingMessage(message));

    this.signalR.onMessageDelivered
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ messageId, deliveredAt }) =>
        this.updateMessageStatus(messageId, 'delivered', deliveredAt),
      );

    this.signalR.onMessageRead
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ messageId, readAt }) =>
        this.updateMessageStatus(messageId, 'read', readAt),
      );

    this.signalR.onUserOnline
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((status) => this.updateUserStatus(status.userId, true));

    this.signalR.onUserOffline
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((status) => this.updateUserStatus(status.userId, false));

    this.signalR.onUserTyping
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ userId }) => this.setTypingIndicator(userId, true));

    this.signalR.onUserStoppedTyping
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ userId }) => this.setTypingIndicator(userId, false));
  }

  private setupSearchDebounce(): void {
    this.searchQuery$
      .pipe(
        debounceTime(UI_CONSTANTS.SEARCH_DEBOUNCE_MS),
        distinctUntilChanged(),
        switchMap((q) =>
          q.trim().length === 0
            ? of([])
            : this.api.searchUsers(q).pipe(catchError(() => EMPTY)),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((users) => this.searchResults.set(users));
  }

  // ── Message signal helpers ──────────────────────────────────────────

  private handleIncomingMessage(message: Message): void {
    const convId =
      message.conversationId ?? this.findConversationIdForMessage(message);

    const existing = this.messages()[convId] ?? [];
    const optimistic = existing.find(
      (m) =>
        m.isOptimistic &&
        m.messageText === message.messageText &&
        m.senderId === message.senderId,
    );

    if (optimistic) {
      this.replaceOptimisticMessage(convId, optimistic.id, message);
    } else {
      this.addMessageToConversation(convId, message);
    }
    this.updateConversationLastMessage(convId, message);
  }

  private addMessageToConversation(
    conversationId: string,
    message: Message,
  ): void {
    this.messages.update((msgs) => ({
      ...msgs,
      [conversationId]: [...(msgs[conversationId] ?? []), message],
    }));
  }

  private replaceOptimisticMessage(
    conversationId: string,
    tempId: string,
    realMessage: Message,
  ): void {
    this.messages.update((msgs) => ({
      ...msgs,
      [conversationId]: (msgs[conversationId] ?? []).map((m) =>
        m.id === tempId ? realMessage : m,
      ),
    }));
  }

  private removeOptimisticMessage(
    conversationId: string,
    tempId: string,
  ): void {
    this.messages.update((msgs) => ({
      ...msgs,
      [conversationId]: (msgs[conversationId] ?? []).filter(
        (m) => m.id !== tempId,
      ),
    }));
  }

  private updateMessageStatus(
    messageId: string,
    status: 'delivered' | 'read',
    timestamp: Date,
  ): void {
    this.messages.update((msgs) => {
      const updated: Record<string, Message[]> = {};
      for (const convId of Object.keys(msgs)) {
        updated[convId] = msgs[convId].map((m) => {
          if (m.id !== messageId) return m;
          return status === 'delivered'
            ? { ...m, deliveredAt: timestamp }
            : { ...m, readAt: timestamp };
        });
      }
      return updated;
    });
  }

  // ── Conversation signal helpers ─────────────────────────────────────

  private updateConversationLastMessage(
    conversationId: string,
    message: Message,
  ): void {
    this.conversations.update((convs) =>
      convs.map((c) =>
        c.userId === conversationId
          ? {
              ...c,
              lastMessageId: message.id,
              lastMessageSenderId: message.senderId,
              lastMessageReceiverId: message.receiverId,
              lastMessageText: message.messageText,
              lastMessageSentAt: message.sentAt.toISOString(),
              lastMessageDeliveredAt: message.deliveredAt?.toISOString(),
              lastMessageReadAt: message.readAt?.toISOString(),
              lastActivity: message.sentAt.toISOString(),
            }
          : c,
      ),
    );
  }

  private updateUserStatus(userId: string, isOnline: boolean): void {
    this.conversations.update((convs) =>
      convs.map((c) => (c.userId === userId ? { ...c, isOnline } : c)),
    );
  }

  private setTypingIndicator(userId: string, isTyping: boolean): void {
    this.conversations.update((convs) =>
      convs.map((c) => (c.userId === userId ? { ...c, isTyping } : c)),
    );
  }

  private async markConversationAsRead(conversationId: string): Promise<void> {
    const currentUserId = this.currentUser()?.id;
    if (!currentUserId) return;

    const unread = (this.messages()[conversationId] ?? []).filter(
      (m) => !m.readAt && m.receiverId === currentUserId,
    );
    if (unread.length === 0) return;

    await Promise.allSettled(
      unread.map((m) =>
        firstValueFrom(this.api.markMessageAsRead(m.id)).catch(() => undefined),
      ),
    );

    this.conversations.update((convs) =>
      convs.map((c) =>
        c.userId === conversationId ? { ...c, unreadCount: 0 } : c,
      ),
    );
  }

  // ── Conversation resolution ─────────────────────────────────────────

  /**
   * Resolve the conversation id for an inbound message, creating a
   * placeholder conversation if one doesn't exist yet.
   */
  private findConversationIdForMessage(message: Message): string {
    const conv = this.conversations().find(
      (c) => c.userId === message.senderId || c.userId === message.receiverId,
    );
    if (conv) return conv.userId;

    const currentUserId = this.currentUser()?.id;
    const otherUserId =
      currentUserId === message.senderId
        ? message.receiverId
        : message.senderId;

    const placeholder = this.createPlaceholderConversation(
      {
        id: otherUserId,
        username: otherUserId,
        email: '',
        displayName: otherUserId,
        isOnline: false,
      },
      message,
    );
    this.conversations.update((convs) => [placeholder, ...convs]);
    return placeholder.userId;
  }

  private getOrCreateConversationIdForUser(userId: string): string {
    const existing = this.conversations().find((c) => c.userId === userId);
    if (existing) return existing.userId;

    const placeholder = this.createPlaceholderConversation({
      id: userId,
      username: userId,
      email: '',
      displayName: userId,
      isOnline: false,
    });
    this.conversations.update((convs) => [placeholder, ...convs]);
    return placeholder.userId;
  }

  /** Build a temporary conversation before the server assigns a real one. */
  private createPlaceholderConversation(
    user: User,
    lastMessage?: Message,
  ): Conversation {
    return {
      userId: user.id,
      username: user.username,
      displayName: user.displayName,
      profilePictureUrl: user.profilePictureUrl,
      isOnline: user.isOnline ?? false,
      lastMessageId: lastMessage?.id,
      lastMessageSenderId: lastMessage?.senderId,
      lastMessageReceiverId: lastMessage?.receiverId,
      lastMessageText: lastMessage?.messageText,
      lastMessageSentAt: lastMessage?.sentAt.toISOString(),
      unreadCount: 0,
      isPinned: false,
      lastActivity:
        lastMessage?.sentAt.toISOString() ?? new Date().toISOString(),
      isTyping: false,
    };
  }
}

// ── Pure helpers (module-private) ───────────────────────────────────────

/** Map a wire-format DTO to the runtime Message model. */
function mapDtoToMessage(dto: MessageDto): Message {
  return {
    id: dto.id,
    senderId: dto.senderId,
    receiverId: dto.receiverId,
    messageText: dto.messageText,
    sentAt: new Date(dto.sentAt),
    deliveredAt: dto.deliveredAt ? new Date(dto.deliveredAt) : undefined,
    readAt: dto.readAt ? new Date(dto.readAt) : undefined,
  };
}
