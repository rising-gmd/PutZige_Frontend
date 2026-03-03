import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslateModule } from '@ngx-translate/core';
import { Store } from '@ngrx/store';
import { MessageListComponent } from '../message-list/message-list.component';
import { MessageInputComponent } from '../message-input/message-input.component';
import { TypingIndicatorComponent } from '../typing-indicator/typing-indicator.component';
import { SignalRService } from '../../services/signalr.service';
import { chatFeature } from '../../../../store/chat/chat.reducer';
import { CHAT_CONSTANTS } from '../../../../core/constants/chat.constants';
import { MessageActions } from '../../../../store/messages/messages.actions';
import { selectActiveConversation } from '../../../../store/chat/chat.selectors';
import {
  selectActiveMessages,
  selectIsMessageLoading,
} from '../../../../store/messages/messages.selectors';
import { DsAvatarComponent } from '../../../../design-system/primitives/avatar/ds-avatar.component';
import { DsIconButtonComponent } from '../../../../design-system/composites/icon-button/ds-icon-button.component';
import { DsEmptyStateComponent } from '../../../../design-system/primitives/empty-state/ds-empty-state.component';
import { TooltipModule } from 'primeng/tooltip';

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
    TooltipModule,
  ],
  templateUrl: './chat-area.component.html',
  styleUrls: ['./chat-area.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatAreaComponent {
  private readonly store = inject(Store);
  private readonly signalR = inject(SignalRService);

  readonly activeConversation = toSignal(
    this.store.select(selectActiveConversation),
    { initialValue: null },
  );
  readonly activeMessages = toSignal(this.store.select(selectActiveMessages), {
    initialValue: [],
  });
  readonly currentUser = toSignal(
    this.store.select(chatFeature.selectCurrentUser),
    { initialValue: null },
  );
  readonly isLoading = toSignal(this.store.select(selectIsMessageLoading), {
    initialValue: false,
  });

  // ── Event handlers ───────────────────────────────────────

  onSendMessage(messageText: string): void {
    const conv = this.activeConversation();
    const user = this.currentUser();
    if (!conv || !user) return;

    // tempId stays in the component so the optimistic placeholder is
    // immediately identifiable without a round-trip.
    const tempId = `${CHAT_CONSTANTS.TEMP_MESSAGE_ID_PREFIX}${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;
    this.store.dispatch(
      MessageActions.sendRequested({
        tempId,
        conversationId: conv.conversationId,
        text: messageText,
        senderId: user.id,
        receiverId: conv.userId,
      }),
    );
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
