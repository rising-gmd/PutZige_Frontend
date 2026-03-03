import {
  Component,
  inject,
  ChangeDetectionStrategy,
  effect,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { MessageListComponent } from '../message-list/message-list.component';
import { MessageInputComponent } from '../message-input/message-input.component';
import { TypingIndicatorComponent } from '../typing-indicator/typing-indicator.component';
import { ChatStateService } from '../../services/chat-state.service';
import { SignalRService } from '../../services/signalr.service';
import { DsAvatarComponent } from '../../../../design-system/primitives/avatar/ds-avatar.component';
import { DsIconButtonComponent } from '../../../../design-system/composites/icon-button/ds-icon-button.component';
import { DsEmptyStateComponent } from '../../../../design-system/primitives/empty-state/ds-empty-state.component';

@Component({
  selector: 'app-chat-area',
  standalone: true,
  imports: [
    TranslateModule,
    MessageListComponent,
    MessageInputComponent,
    TypingIndicatorComponent,
    DsAvatarComponent,
    DsIconButtonComponent,
    DsEmptyStateComponent,
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

  constructor() {
    // Logging side-effect only — signals with OnPush make markForCheck() unnecessary.
    // Retained solely so the effect keeps the TS import checker happy until the
    // logger service is wired in (INC-XXXX).
    effect(() => void this.activeMessages());
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
