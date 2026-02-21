import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ChatStateService } from './chat-state.service';
import { ChatApiService } from './chat-api.service';
import { ConversationService } from './conversation.service';
import { SignalRService } from './signalr.service';
import { NotificationService } from '../../../shared/services/notification.service';

describe('ChatStateService (integration-light)', () => {
  let chatState: ChatStateService;

  const mockChatApi: Partial<Record<keyof ChatApiService, jest.Mock>> = {
    getCurrentUser: jest.fn().mockReturnValue(of({ id: 'u1', username: 'me' })),
    getConversations: jest.fn().mockReturnValue(
      of([
        {
          conversationId: 'c1',
          userId: 'u2',
          username: 'bob',
          displayName: 'Bob',
          profilePictureUrl: null,
          isOnline: false,
          unreadCount: 5,
          lastActivity: new Date().toISOString(),
        },
      ]),
    ),
    getConversationHistory: jest
      .fn()
      .mockReturnValue(
        of({
          messages: [
            {
              id: 'm1',
              senderId: 'u2',
              receiverId: 'u1',
              messageText: 'hi',
              sentAt: new Date().toISOString(),
            },
          ],
        }),
      ),
  } as any;

  const mockConvApi = {
    markConversationAsRead: jest.fn().mockReturnValue(of(undefined)),
  } as Partial<ConversationService> as ConversationService;

  const mockSignalR = {
    startConnection: jest.fn().mockResolvedValue(undefined),
    onMessageReceived: of(),
    onMessageDelivered: of(),
    onMessageRead: of(),
    onUserOnline: of(),
    onUserOffline: of(),
    onUserTyping: of(),
    onUserStoppedTyping: of(),
    sendMessage: jest.fn(),
    notifyTyping: jest.fn(),
  } as Partial<SignalRService> as SignalRService;

  const mockNotification = {
    showError: jest.fn(),
    showSuccess: jest.fn(),
  } as Partial<NotificationService> as NotificationService;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        ChatStateService,
        { provide: ChatApiService, useValue: mockChatApi },
        { provide: ConversationService, useValue: mockConvApi },
        { provide: SignalRService, useValue: mockSignalR },
        { provide: NotificationService, useValue: mockNotification },
      ],
    });

    chatState = TestBed.inject(ChatStateService);
    // initialize will call getCurrentUser and load conversations
    await chatState.initialize();
  });

  it('setActiveConversation should load messages and call markConversationAsRead', async () => {
    expect(chatState.conversations().length).toBeGreaterThan(0);
    const conv = chatState.conversations()[0];
    expect(conv.conversationId).toBe('c1');

    await chatState.setActiveConversation('c1');

    // conversation-level API was called to mark as read
    expect(mockConvApi.markConversationAsRead).toHaveBeenCalledWith('c1');

    // messages for conversation should be loaded
    const msgs = chatState.messages()['c1'] ?? [];
    expect(msgs.length).toBeGreaterThan(0);

    // unread count should be cleared on conversation
    const updatedConv = chatState
      .conversations()
      .find((c) => c.conversationId === 'c1');
    expect(updatedConv?.unreadCount).toBe(0);
  });
});
