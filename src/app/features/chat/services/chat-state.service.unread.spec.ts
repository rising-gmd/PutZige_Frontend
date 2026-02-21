import { TestBed } from '@angular/core/testing';
import { Subject, of } from 'rxjs';
import { ChatStateService } from './chat-state.service';
import { ChatApiService } from './chat-api.service';
import { ConversationService } from './conversation.service';
import { SignalRService } from './signalr.service';
import { NotificationService } from '../../../shared/services/notification.service';
import { Message } from '../models/message.model';

describe('ChatStateService — unreadCount (SignalR) behavior', () => {
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
          unreadCount: 2,
          lastActivity: new Date().toISOString(),
        },
      ]),
    ),
    getConversationHistory: jest.fn().mockReturnValue(of({ messages: [] })),
  } as Partial<ChatApiService>;

  const mockConvApi = {
    markConversationAsRead: jest.fn().mockReturnValue(of(undefined)),
  } as Partial<ConversationService> as ConversationService;

  let messageReceived$!: Subject<Message>;
  const makeMockSignalR = () => {
    messageReceived$ = new Subject<Message>();
    return {
      startConnection: jest.fn().mockResolvedValue(undefined),
      onMessageReceived: messageReceived$.asObservable(),
      onMessageDelivered: of(),
      onMessageRead: of(),
      onUserOnline: of(),
      onUserOffline: of(),
      onUserTyping: of(),
      onUserStoppedTyping: of(),
      sendMessage: jest.fn(),
      notifyTyping: jest.fn(),
    } as Partial<SignalRService> as SignalRService;
  };

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
        { provide: SignalRService, useValue: makeMockSignalR() },
        { provide: NotificationService, useValue: mockNotification },
      ],
    });

    chatState = TestBed.inject(ChatStateService);
    // initialize will call getCurrentUser and load conversations and wire SignalR
    await chatState.initialize();
  });

  afterEach(() => jest.clearAllMocks());

  it('Case A: when message arrives for active conversation, markConversationAsRead is called and unreadCount is 0', async () => {
    // arrange: make c1 active and emit a message for c1
    chatState.activeConversationId.set('c1');

    const incoming: Message = {
      id: 'm-srv-1',
      senderId: 'u2',
      receiverId: 'u1',
      messageText: 'hello from server',
      sentAt: new Date(),
      conversationId: 'c1',
      unreadCount: 0,
    };

    // act
    messageReceived$.next(incoming);

    // allow signals to flush (TestBed.tick not necessary here because the
    // service uses synchronous signal updates, but keep assertions simple)

    // assert: markConversationAsRead called
    expect(mockConvApi.markConversationAsRead).toHaveBeenCalledWith('c1');

    // conversation unreadCount should be 0 (forced when active)
    const conv = chatState
      .conversations()
      .find((c) => c.conversationId === 'c1');
    expect(conv?.unreadCount).toBe(0);
  });

  it('Case B: when message arrives for non-active conversation, markConversationAsRead is NOT called and unreadCount matches server payload', async () => {
    // arrange: active conversation is different
    chatState.activeConversationId.set('other');

    const incoming: Message = {
      id: 'm-srv-2',
      senderId: 'u2',
      receiverId: 'u1',
      messageText: 'you have mail',
      sentAt: new Date(),
      conversationId: 'c1',
      unreadCount: 3,
    };

    // act
    messageReceived$.next(incoming);

    // assert: markConversationAsRead NOT called for c1
    expect(mockConvApi.markConversationAsRead).not.toHaveBeenCalled();

    // unreadCount must reflect server value
    const conv = chatState
      .conversations()
      .find((c) => c.conversationId === 'c1');
    expect(conv?.unreadCount).toBe(3);
  });

  it('Edge: message without conversationId does not throw and is handled gracefully', () => {
    const incoming: Message = {
      id: 'm-srv-3',
      senderId: 'u2',
      receiverId: 'u1',
      messageText: 'no conv id',
      sentAt: new Date(),
      // no conversationId
      unreadCount: 1,
    };

    expect(() => messageReceived$.next(incoming)).not.toThrow();
  });

  it('Edge: missing unreadCount defaults to 0 safely', () => {
    chatState.activeConversationId.set('other');
    const incoming: Message = {
      id: 'm-srv-4',
      senderId: 'u2',
      receiverId: 'u1',
      messageText: 'missing unreadCount',
      sentAt: new Date(),
      conversationId: 'c1',
      // unreadCount omitted
    };

    messageReceived$.next(incoming);

    const conv = chatState
      .conversations()
      .find((c) => c.conversationId === 'c1');
    expect(conv?.unreadCount).toBe(0);
  });
});
