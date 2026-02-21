import { type Page, type Locator, expect } from '@playwright/test';

export class ChatPage {
  readonly page: Page;
  readonly conversationsList: Locator;
  readonly chatArea: Locator;

  constructor(page: Page) {
    this.page = page;
    // Use test ids and ARIA roles only per project rules
    this.conversationsList = page.getByTestId('conversations-list');
    this.chatArea = page.getByTestId('chat-area');
  }

  async goto() {
    await this.page.goto('/chat');
    await expect(this.conversationsList).toBeVisible();
  }

  conversationItem(conversationId: string) {
    return this.page.getByTestId(`conversation-item-${conversationId}`);
  }

  conversationBadge(conversationId: string) {
    return this.page.getByTestId(`conversation-badge-${conversationId}`);
  }

  async openConversation(conversationId: string) {
    await this.conversationItem(conversationId).click();
    await expect(this.chatArea).toBeVisible();
  }

  async getLastMessageText() {
    return this.chatArea.getByTestId('last-message-text').innerText();
  }
}
