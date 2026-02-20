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
import { parseDate } from '../../../core/utils/date.util';
import { NotificationService } from '../../../shared/services/notification.service';
import { ConversationService } from './conversation.service';

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
  private readonly convApi = inject(ConversationService);
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
      ? (this.conversations().find((c) => c.conversationId === id) ?? null)
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
      const ta = parseDate(a.lastActivity)?.getTime() ?? 0;
      const tb = parseDate(b.lastActivity)?.getTime() ?? 0;
      return tb - ta;
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
  async sendMessage(
    conversationId: string,
    messageText: string,
  ): Promise<void> {
    const user = this.currentUser();
    if (!user) throw new Error('User not authenticated');

    const conv = this.conversations().find(
      (c) => c.conversationId === conversationId,
    );
    if (!conv) throw new Error('Conversation not found');

    const receiverId = conv.userId;
    const tempId = `temp-${Date.now()}`;

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
      await this.signalR.sendMessage(conversationId, messageText);
    } catch {
      // SignalR unavailable — fall back to REST
      try {
        const dto = await firstValueFrom(
          this.api.sendMessage({ conversationId, messageText }),
        );
        const realMessage: Message = {
          id: dto.messageId,
          senderId: dto.senderId,
          receiverId: dto.receiverId,
          messageText: dto.messageText,
          sentAt: parseDate(dto.sentAt) ?? new Date(),
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
  /**
   * Start a conversation with a user.
   *
   * Flow:
   * 1. Check if conversation already exists (instant switch)
   * 2. If not, create via API (gets real conversationId)
   * 3. Update state with real conversation
   * 4. Set as active
   *
   * This prevents race conditions where user sends message before conversation exists.
   */
  async startConversation(user: User): Promise<void> {
    // Fast path: conversation already exists
    const existing = this.conversations().find((c) => c.userId === user.id);
    if (existing) {
      await this.setActiveConversation(existing.conversationId);
      return;
    }

    // Slow path: create conversation first
    try {
      // Call backend to create/get conversation
      const convResponse = await firstValueFrom(
        this.api.createOrGetConversation(user.id),
      );

      // Create conversation with REAL conversationId from backend
      const newConversation: Conversation = {
        conversationId: convResponse.conversationId, // CRITICAL: Use real ID from backend
        userId: user.id,
        username: user.username,
        displayName: user.displayName ?? user.username,
        profilePictureUrl: user.profilePictureUrl,
        isOnline: user.isOnline ?? false,
        unreadCount: 0,
        isPinned: false,
        lastActivity: convResponse.lastActivity,
        isTyping: false,
      } as Conversation;

      // Add to state
      this.conversations.update((convs) => [newConversation, ...convs]);

      // Set as active
      await this.setActiveConversation(newConversation.conversationId);

      this.notification.showSuccess(
        `Started conversation with ${user.displayName ?? user.username}`,
      );
    } catch (err: unknown) {
      // Handle 404 user-not-found specially
      const msg = extractErrorMessage(err);
      this.error.set(msg);
      this.notification.showError(`Failed to start conversation: ${msg}`);
      throw err;
    }
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
    console.log('[ChatState] Received message:', message);

    const convId =
      message.conversationId ?? this.findConversationIdForMessage(message);

    if (!convId) {
      console.warn('Received message with no conversation context', message);
      return;
    }

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
        c.conversationId === conversationId
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

    const msgs = this.messages()[conversationId] ?? [];
    const unread = msgs.filter(
      (m) => !m.readAt && m.receiverId === currentUserId,
    );
    if (unread.length === 0) return;

    // Optimistic local update: mark unread messages as read and clear unreadCount
    const now = new Date();
    this.messages.update((all) => ({
      ...all,
      [conversationId]: (all[conversationId] ?? []).map((m) =>
        !m.readAt && m.receiverId === currentUserId ? { ...m, readAt: now } : m,
      ),
    }));

    this.conversations.update((convs) =>
      convs.map((c) =>
        c.conversationId === conversationId
          ? { ...c, unreadCount: 0, lastMessageReadAt: now.toISOString() }
          : c,
      ),
    );

    // Single conversation-level API call (best-effort, silent fail)
    try {
      await firstValueFrom(this.convApi.markConversationAsRead(conversationId));
    } catch {
      // silent fail per requirements — no user-visible error
    }
  }

  // ── Conversation resolution ─────────────────────────────────────────

  /**
   * Resolve the conversation id for an inbound message, creating a
   * placeholder conversation if one doesn't exist yet.
   */
  private findConversationIdForMessage(message: Message): string | undefined {
    const conv = this.conversations().find(
      (c) => c.userId === message.senderId || c.userId === message.receiverId,
    );
    if (conv) return conv.conversationId;

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
    return placeholder.conversationId;
  }

  /** Build a temporary conversation before the server assigns a real one. */
  private createPlaceholderConversation(
    user: User,
    lastMessage?: Message,
  ): Conversation {
    return {
      conversationId: user.id,
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
      lastMessageDeliveredAt: lastMessage?.deliveredAt?.toISOString(),
      lastMessageReadAt: lastMessage?.readAt?.toISOString(),
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
    sentAt: parseDate(dto.sentAt) ?? new Date(),
    deliveredAt: dto.deliveredAt
      ? (parseDate(dto.deliveredAt) ?? undefined)
      : undefined,
    readAt: dto.readAt ? (parseDate(dto.readAt) ?? undefined) : undefined,
  };
}
