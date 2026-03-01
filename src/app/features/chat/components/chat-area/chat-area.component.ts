// ============================================================
// chat-area.component.ts
// Path: src/app/features/chat/components/chat-area/
// ============================================================
import {
  Component,
  inject,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { MessageListComponent } from '../message-list/message-list.component';
import { MessageInputComponent } from '../message-input/message-input.component';
import { TypingIndicatorComponent } from '../typing-indicator/typing-indicator.component';
import { ChatStateService } from '../../services/chat-state.service';
import { SignalRService } from '../../services/signalr.service';
import { Conversation } from '../../models/conversation.model';

@Component({
  selector: 'app-chat-area',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
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
      this.activeMessages();
      this.cdr.markForCheck();
    });
  }

  // ── Display helpers ──────────────────────────────────────

  convDisplayName(conv: Conversation): string {
    return conv.displayName?.trim() || conv.username || 'Unknown';
  }

  convInitials(conv: Conversation): string {
    return this.convDisplayName(conv)
      .split(/\s+/)
      .map((w) => w.charAt(0))
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  // ── Event handlers ───────────────────────────────────────

  onSendMessage(messageText: string): void {
    const conv = this.activeConversation();
    if (!conv) return;
    this.chatState.sendMessage(conv.conversationId, messageText);
  }

  onTypingStarted(): void {
    const conv = this.activeConversation();
    if (!conv) return;
    this.signalR.notifyTyping(conv.conversationId, true);
  }

  onTypingStopped(): void {
    const conv = this.activeConversation();
    if (!conv) return;
    this.signalR.notifyTyping(conv.conversationId, false);
  }
}
