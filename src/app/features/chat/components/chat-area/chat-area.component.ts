import {
  Component,
  inject,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  effect,
} from '@angular/core';
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
  private readonly cdr = inject(ChangeDetectorRef);

  readonly activeConversation = this.chatState.activeConversation;
  readonly activeMessages = this.chatState.activeMessages;
  readonly currentUser = this.chatState.currentUser;
  readonly isLoading = this.chatState.isLoadingMessages;

  constructor() {
    effect(() => {
      const messages = this.activeMessages();
      console.log('[ChatArea] Active messages changed:', messages.length);
      this.cdr.markForCheck();
    });
  }

  // ngOnInit intentionally left blank; marking-as-read is handled by ChatStateService.setActiveConversation

  onSendMessage(messageText: string): void {
    const conversation = this.activeConversation();
    if (!conversation) return;

    // Fire-and-forget: ChatStateService handles optimistic updates and errors
    this.chatState.sendMessage(conversation.conversationId, messageText);
  }

  onTypingStarted(): void {
    const conversation = this.activeConversation();
    if (!conversation) return;
    this.signalR.notifyTyping(conversation.conversationId, true);
  }

  onTypingStopped(): void {
    const conversation = this.activeConversation();
    if (!conversation) return;
    this.signalR.notifyTyping(conversation.conversationId, false);
  }
}
