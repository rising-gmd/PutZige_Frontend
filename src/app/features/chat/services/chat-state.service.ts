import { Injectable, inject, computed, signal, OnDestroy } from '@angular/core';
import {
  Subject,
  debounceTime,
  distinctUntilChanged,
  takeUntil,
  firstValueFrom,
} from 'rxjs';
import { ChatApiService } from './chat-api.service';
import { SignalRService } from './signalr.service';
import {
  Conversation,
  Message,
  User,
  ConversationHistoryResponse,
  MessageDto,
} from '../models';
import { NotificationService } from '../../../shared/services/notification.service';

@Injectable({ providedIn: 'root' })
export class ChatStateService implements OnDestroy {
  private readonly api = inject(ChatApiService);
  private readonly signalR = inject(SignalRService);
  private readonly notification = inject(NotificationService);

  // ==================== STATE SIGNALS ====================
  readonly currentUser = signal<User | null>(null);
  readonly conversations = signal<Conversation[]>([]);
  readonly activeConversationId = signal<string | null>(null);
  readonly messages = signal<Record<string, Message[]>>({});

  readonly isLoadingConversations = signal(false);
  readonly isLoadingMessages = signal(false);
  readonly isSendingMessage = signal(false);

  readonly error = signal<string | null>(null);

  // search
  private readonly searchQuery$ = new Subject<string>();
  readonly searchResults = signal<User[]>([]);
  // lifecycle
  private readonly destroy$ = new Subject<void>();

  // ==================== COMPUTED ====================
  readonly activeConversation = computed(() => {
    const id = this.activeConversationId();
    return id ? (this.conversations().find((c) => c.id === id) ?? null) : null;
  });

  readonly activeMessages = computed(() => {
    const id = this.activeConversationId();
    return id ? (this.messages()[id] ?? []) : [];
  });

  readonly totalUnreadCount = computed(() =>
    this.conversations().reduce((s, c) => s + c.unreadCount, 0),
  );

  readonly sortedConversations = computed(() => {
    return [...this.conversations()].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return b.lastActivity.getTime() - a.lastActivity.getTime();
    });
  });

  constructor() {
    this.setupSignalRListeners();
    this.setupSearchDebounce();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ==================== PUBLIC METHODS ====================
  /**
   * Initialize chat state and start SignalR connection.
   * @param getAccessToken - async factory that returns fresh access token when needed
   */
  async initialize(getAccessToken: () => Promise<string>): Promise<void> {
    this.error.set(null);
    try {
      const user = await firstValueFrom(this.api.getCurrentUser());
      this.currentUser.set(user);
      await this.loadConversations();
      await this.signalR.startConnection(getAccessToken);
    } catch (err: unknown) {
      const msg = extractErrorMessage(err);
      this.error.set(msg);
      this.notification.showError(msg);
      throw err;
    }
  }

  async loadConversations(refresh = false): Promise<void> {
    this.isLoadingConversations.set(true);
    this.error.set(null);
    this.api.getConversations(refresh).subscribe({
      next: (convs: Conversation[]) => {
        this.conversations.set(convs);
        this.isLoadingConversations.set(false);
      },
      error: (err: unknown) => {
        this.isLoadingConversations.set(false);
        this.error.set(extractErrorMessage(err));
      },
    });
  }

  async setActiveConversation(conversationId: string): Promise<void> {
    this.activeConversationId.set(conversationId);
    if (!this.messages()[conversationId]) {
      await this.loadMessages(conversationId);
    }
    await this.markConversationAsRead(conversationId);
  }

  async loadMessages(conversationId: string, pageNumber = 1): Promise<void> {
    this.isLoadingMessages.set(true);
    this.error.set(null);
    this.api.getConversationHistory(conversationId, pageNumber, 50).subscribe({
      next: (response: ConversationHistoryResponse) => {
        const mapped = (response.messages ?? []).map(
          (m: MessageDto) =>
            ({
              id: m.id,
              senderId: m.senderId,
              receiverId: m.receiverId,
              messageText: m.messageText,
              sentAt: new Date(m.sentAt),
              deliveredAt: m.deliveredAt ? new Date(m.deliveredAt) : undefined,
              readAt: m.readAt ? new Date(m.readAt) : undefined,
            }) as Message,
        );

        this.messages.update((msgs) => ({ ...msgs, [conversationId]: mapped }));
        this.isLoadingMessages.set(false);
      },
      error: (err: unknown) => {
        this.isLoadingMessages.set(false);
        this.error.set(extractErrorMessage(err));
      },
    });
  }

  async sendMessage(receiverId: string, messageText: string): Promise<void> {
    const tempId = `temp-${Date.now()}`;
    const user = this.currentUser();
    if (!user) throw new Error('User not authenticated');

    // Resolve conversation id for the given participant id (receiverId is otherUser.id in callers)
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
      // preferred: SignalR
      await this.signalR.sendMessage(receiverId, messageText);
    } catch {
      // fallback to REST
      try {
        const realDto = await firstValueFrom(
          this.api.sendMessage({ receiverId, messageText }),
        );
        // Map DTO to runtime Message model
        const mapped: Message = {
          id: realDto.messageId,
          senderId: realDto.senderId,
          receiverId: realDto.receiverId,
          messageText: realDto.messageText,
          sentAt: new Date(realDto.sentAt),
          deliveredAt: undefined,
          readAt: undefined,
          // keep conversation id as the resolved one when backend doesn't provide it
          conversationId:
            (realDto as { conversationId?: string }).conversationId ??
            conversationId,
        };

        this.replaceOptimisticMessage(conversationId, tempId, mapped);
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

  searchUsers(query: string): void {
    this.searchQuery$.next(query);
  }

  startConversation(user: User): void {
    const existing = this.conversations().find(
      (c) => c.otherUser.id === user.id,
    );
    if (existing) {
      void this.setActiveConversation(existing.id);
      return;
    }

    const conversationId = generateUuid();

    const newConversation: Conversation = {
      id: conversationId,
      otherUser: user,
      lastMessage: undefined,
      unreadCount: 0,
      isPinned: false,
      lastActivity: new Date(),
      isTyping: false,
    };

    this.conversations.update((convs) => [newConversation, ...convs]);
    void this.setActiveConversation(newConversation.id);
  }

  // ==================== PRIVATE HELPERS ====================
  private setupSignalRListeners(): void {
    this.signalR.onMessageReceived
      .pipe(takeUntil(this.destroy$))
      .subscribe((message) => {
        // Determine conversation id: prefer server-provided conversationId
        const convId =
          message.conversationId ?? this.findConversationIdForMessage(message);

        // Try to reconcile optimistic message if present
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
      });

    this.signalR.onMessageDelivered
      .pipe(takeUntil(this.destroy$))
      .subscribe(({ messageId, deliveredAt }) => {
        this.updateMessageStatus(messageId, 'delivered', deliveredAt);
      });

    this.signalR.onMessageRead
      .pipe(takeUntil(this.destroy$))
      .subscribe(({ messageId, readAt }) => {
        this.updateMessageStatus(messageId, 'read', readAt);
      });

    this.signalR.onUserOnline
      .pipe(takeUntil(this.destroy$))
      .subscribe((status) => this.updateUserStatus(status.userId, true));
    this.signalR.onUserOffline
      .pipe(takeUntil(this.destroy$))
      .subscribe((status) => this.updateUserStatus(status.userId, false));

    this.signalR.onUserTyping
      .pipe(takeUntil(this.destroy$))
      .subscribe(({ userId }) => this.setTypingIndicator(userId, true));
    this.signalR.onUserStoppedTyping
      .pipe(takeUntil(this.destroy$))
      .subscribe(({ userId }) => this.setTypingIndicator(userId, false));
  }

  private setupSearchDebounce(): void {
    this.searchQuery$
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((q) => {
        if (!q || q.trim().length === 0) {
          this.searchResults.set([]);
          return;
        }

        this.api
          .searchUsers(q)
          .subscribe({
            next: (users: User[]) => this.searchResults.set(users),
            error: () => this.searchResults.set([]),
          });
      });
  }

  private addMessageToConversation(
    conversationId: string,
    message: Message,
  ): void {
    this.messages.update((msgs) => {
      const copy = { ...msgs };
      const list = copy[conversationId] ? [...copy[conversationId]] : [];
      list.push(message);
      copy[conversationId] = list;
      return copy;
    });
  }

  private replaceOptimisticMessage(
    conversationId: string,
    tempId: string,
    realMessage: Message,
  ): void {
    this.messages.update((msgs) => {
      const copy = { ...msgs };
      const list = (copy[conversationId] ?? []).map((m) =>
        m.id === tempId ? realMessage : m,
      );
      copy[conversationId] = list;
      return copy;
    });
  }

  private removeOptimisticMessage(
    conversationId: string,
    tempId: string,
  ): void {
    this.messages.update((msgs) => {
      const copy = { ...msgs };
      copy[conversationId] = (copy[conversationId] ?? []).filter(
        (m) => m.id !== tempId,
      );
      return copy;
    });
  }

  private updateMessageStatus(
    messageId: string,
    status: 'delivered' | 'read',
    timestamp: Date,
  ): void {
    this.messages.update((msgs) => {
      const updated = { ...msgs };
      for (const convId of Object.keys(updated)) {
        updated[convId] = updated[convId].map((m) => {
          if (m.id === messageId) {
            if (status === 'delivered') return { ...m, deliveredAt: timestamp };
            return { ...m, readAt: timestamp };
          }
          return m;
        });
      }
      return updated;
    });
  }

  private updateConversationLastMessage(
    conversationId: string,
    message: Message,
  ): void {
    this.conversations.update((convs) =>
      convs.map((c) =>
        c.id === conversationId
          ? { ...c, lastMessage: message, lastActivity: message.sentAt }
          : c,
      ),
    );
  }

  private updateUserStatus(userId: string, isOnline: boolean): void {
    this.conversations.update((convs) =>
      convs.map((c) =>
        c.otherUser.id === userId
          ? { ...c, otherUser: { ...c.otherUser, isOnline } }
          : c,
      ),
    );
  }

  private setTypingIndicator(userId: string, isTyping: boolean): void {
    this.conversations.update((convs) =>
      convs.map((c) => (c.otherUser.id === userId ? { ...c, isTyping } : c)),
    );
  }

  private async markConversationAsRead(conversationId: string): Promise<void> {
    const msgs = this.messages()[conversationId] ?? [];
    const unread = msgs.filter(
      (m) => !m.readAt && m.receiverId === this.currentUser()?.id,
    );

    const promises = unread.map((m) =>
      firstValueFrom(this.api.markMessageAsRead(m.id)).catch(() => undefined),
    );
    await Promise.allSettled(promises);

    this.conversations.update((convs) =>
      convs.map((c) =>
        c.id === conversationId ? { ...c, unreadCount: 0 } : c,
      ),
    );
  }

  /**
   * Find an existing conversation id for an incoming message.
   * If none exists, create a lightweight conversation placeholder and return its id.
   */
  private findConversationIdForMessage(message: Message): string {
    // Prefer conversations where the other participant matches sender or receiver
    const conv = this.conversations().find(
      (c) =>
        c.otherUser.id === message.senderId ||
        c.otherUser.id === message.receiverId,
    );
    if (conv) return conv.id;

    // Create a minimal conversation placeholder
    const currentUser = this.currentUser();
    const otherUserId =
      currentUser && currentUser.id === message.senderId
        ? message.receiverId
        : message.senderId;

    const placeholderUser: User = {
      id: otherUserId,
      username: otherUserId,
      email: '',
      displayName: otherUserId,
      isOnline: false,
    };

    const conversationId = generateUuid();

    const newConversation: Conversation = {
      id: conversationId,
      otherUser: placeholderUser,
      lastMessage: message,
      unreadCount: 0,
      isPinned: false,
      lastActivity: message.sentAt,
    };

    this.conversations.update((convs) => [newConversation, ...convs]);
    return conversationId;
  }

  private getOrCreateConversationIdForUser(userId: string): string {
    const existing = this.conversations().find(
      (c) => c.otherUser.id === userId,
    );
    if (existing) return existing.id;

    // create placeholder conversation
    const placeholderUser: User = {
      id: userId,
      username: userId,
      email: '',
      displayName: userId,
      isOnline: false,
    };

    const conversationId = generateUuid();

    const newConversation: Conversation = {
      id: conversationId,
      otherUser: placeholderUser,
      lastMessage: undefined,
      unreadCount: 0,
      isPinned: false,
      lastActivity: new Date(),
    };

    this.conversations.update((convs) => [newConversation, ...convs]);
    return conversationId;
  }
}

function extractErrorMessage(err: unknown): string {
  if (!err) return 'Unknown error';
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

function generateUuid(): string {
  const g = globalThis as unknown as { crypto?: { randomUUID?: unknown } };
  if (g.crypto && typeof g.crypto.randomUUID === 'function') {
    return (g.crypto.randomUUID as () => string)();
  }
  return `conv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
