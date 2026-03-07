import {
  Component,
  inject,
  ChangeDetectionStrategy,
  viewChild,
  output,
  computed,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Store } from '@ngrx/store';
import { Menu, MenuModule } from 'primeng/menu';
import { MenuItem } from 'primeng/api';
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
    MenuModule,
    TooltipModule,
  ],
  templateUrl: './chat-area.component.html',
  styleUrls: ['./chat-area.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatAreaComponent {
  private readonly store = inject(Store);
  private readonly signalR = inject(SignalRService);
  private readonly translate = inject(TranslateService);

  private readonly headerMenu = viewChild<Menu>('headerMenu');
  private readonly messageList = viewChild<MessageListComponent>('messageList');

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

  /**
   * Messages to display in the chat area.
   */
  readonly displayMessages = computed(() => this.activeMessages());

  /** User ID used as `currentUserId` for bubble alignment (own vs other). */
  readonly displayCurrentUserId = computed(() => this.currentUser()?.id ?? '');

  readonly viewProfile = output<string>();
  readonly archive = output<string>();
  readonly block = output<string>();
  readonly deleteChat = output<string>();

  readonly headerMenuItems = computed<MenuItem[]>(() => {
    const conv = this.activeConversation();
    const id = conv?.conversationId ?? '';
    return [
      {
        label: this.translate.instant('chat.menu_view_profile'),
        command: () => this.viewProfile.emit(id),
      },
      {
        label: this.translate.instant('chat.menu_add_to_archive'),
        command: () => this.archive.emit(id),
      },
      { separator: true },
      {
        label: this.translate.instant('chat.menu_block'),
        styleClass: 'menu-item-danger',
        command: () => this.block.emit(id),
      },
      {
        label: this.translate.instant('chat.menu_delete'),
        styleClass: 'menu-item-danger',
        command: () => this.deleteChat.emit(id),
      },
    ];
  });

  toggleHeaderMenu(event: MouseEvent): void {
    this.headerMenu()?.toggle(event);
  }

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

    // Scroll to the newly sent message after dispatch
    setTimeout(() => this.messageList()?.scrollToBottom());
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
