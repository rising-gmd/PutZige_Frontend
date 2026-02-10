import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MessageListComponent } from '../message-list/message-list.component';
import { MessageInputComponent } from '../message-input/message-input.component';
import { TypingIndicatorComponent } from '../typing-indicator/typing-indicator.component';
import { ChatStateService } from '../../services/chat-state.service';
import { SignalRService } from '../../services/signalr.service';

@Component({
  selector: 'app-chat-area',
  standalone: true,
  imports: [
    CommonModule,
    MessageListComponent,
    MessageInputComponent,
    TypingIndicatorComponent,
  ],
  templateUrl: './chat-area.component.html',
  styleUrls: ['./chat-area.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatAreaComponent {
  private readonly chatState = inject(ChatStateService);
  private readonly signalR = inject(SignalRService);

  readonly activeConversation = this.chatState.activeConversation;
  readonly activeMessages = this.chatState.activeMessages;
  readonly currentUser = this.chatState.currentUser;
  readonly isLoading = this.chatState.isLoadingMessages;

  async onSendMessage(messageText: string): Promise<void> {
    const conversation = this.activeConversation();
    if (!conversation) return;

    await this.chatState.sendMessage(conversation.otherUser.id, messageText);
  }

  onTypingStarted(): void {
    const conversation = this.activeConversation();
    if (!conversation) return;
    void this.signalR.notifyTyping(conversation.id, true);
  }

  onTypingStopped(): void {
    const conversation = this.activeConversation();
    if (!conversation) return;
    void this.signalR.notifyTyping(conversation.id, false);
  }
}
