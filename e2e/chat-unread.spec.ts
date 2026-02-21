import { test, expect } from '@playwright/test';
import { ChatPage } from './page-objects/chat.po';

// These tests assume the app exposes deterministic test ids:
// - conversation-item-{conversationId}
// - conversation-badge-{conversationId}
// - conversations-list
// - chat-area
// - last-message-text

test.describe('Real-time unread badge behaviour', () => {
  test.beforeEach(async ({ page }) => {
    // Each test should authenticate a user; for brevity assume a deterministic
    // test login endpoint exists that sets cookies. Use page.route to stub
    // SignalR-related network responses if needed.
    await page.goto('/login');
    // NOTE: Replace with real login flow for your test environment
    await page.getByLabel('Email address').fill('userb@example.com');
    await page.getByLabel('Password').fill('Password123!');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.waitForURL('/chat');
  });

  test('Case A — open chat receives message: no badge, message appears', async ({
    page,
  }) => {
    const chat = new ChatPage(page);
    await chat.goto();

    // Ensure conversation 'c-a' is open
    await chat.openConversation('c-a');

    // Mock incoming SignalR message for conversation c-a with unreadCount = 0
    await page.route('**/hubs/chat/**', (route) => {
      // Simplified: fulfill with a 200 so app can open connection. More
      // advanced websockets mocking may be required in CI.
      route.fulfill({ status: 200, body: '{}' });
    });

    // Trigger a server push via a test-only endpoint (replace with your stub)
    await page.request.post('/__test__/signalr/send', {
      data: {
        event: 'ReceiveMessage',
        payload: {
          messageId: 'm-e2e-1',
          conversationId: 'c-a',
          senderId: 'u-a',
          receiverId: 'userb',
          messageText: 'hello from user A',
          sentAt: new Date().toISOString(),
          unreadCount: 0,
        },
      },
    });

    // Badge for c-a should not appear
    await expect(chat.conversationBadge('c-a')).toHaveCount(0);

    // Message should appear in chat area
    await expect(await chat.getLastMessageText()).toContain(
      'hello from user A',
    );
  });

  test('Case B — closed chat receives message: badge appears, clears on open', async ({
    page,
  }) => {
    const chat = new ChatPage(page);
    await chat.goto();

    // Start with a different conversation open
    await chat.openConversation('c-other');

    // Mock SignalR connection route as above
    await page.route('**/hubs/chat/**', (route) =>
      route.fulfill({ status: 200, body: '{}' }),
    );

    // Send server push for conversation c-b with unreadCount 4
    await page.request.post('/__test__/signalr/send', {
      data: {
        event: 'ReceiveMessage',
        payload: {
          messageId: 'm-e2e-2',
          conversationId: 'c-b',
          senderId: 'u-a',
          receiverId: 'userb',
          messageText: 'new message for c-b',
          sentAt: new Date().toISOString(),
          unreadCount: 4,
        },
      },
    });

    // Badge must appear with the server-provided count
    const badge = chat.conversationBadge('c-b');
    await expect(badge).toBeVisible();
    await expect(badge).toHaveText('4');

    // When user clicks, badge clears immediately
    await chat.openConversation('c-b');
    await expect(chat.conversationBadge('c-b')).toHaveCount(0);

    // And messages are visible
    await expect(await chat.getLastMessageText()).toContain(
      'new message for c-b',
    );
  });
});
