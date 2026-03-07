import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { Menu, MenuModule } from 'primeng/menu';
import { MenuItem } from 'primeng/api';
import { Conversation } from '../../models/conversation.model';
import { ConversationTimePipe } from '../../../../shared/pipes/conversation-time.pipe';
import { DsAvatarComponent } from '../../../../design-system/primitives/avatar/ds-avatar.component';
import { DsIconButtonComponent } from '../../../../design-system/composites/icon-button/ds-icon-button.component';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-conversation-item',
  standalone: true,
  imports: [
    MenuModule,
    ConversationTimePipe,
    DsAvatarComponent,
    DsIconButtonComponent,
    TranslateModule,
  ],
  templateUrl: './conversation-item.component.html',
  styleUrls: ['./conversation-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConversationItemComponent {
  readonly conversation = input.required<Conversation>();
  readonly isActive = input(false);
  /**
   * Passed down from ConversationListComponent so this pure presentational
   * component can compute the read-receipt checkmark without touching the store.
   */
  readonly currentUserId = input('');

  readonly selected = output<string>();
  readonly viewProfile = output<string>();
  readonly archive = output<string>();
  readonly block = output<string>();
  readonly deleteConv = output<string>();

  private readonly itemMenu = viewChild.required<Menu>('itemMenu');

  /** Tracks whether the popup context menu is currently open. */
  readonly isMenuOpen = signal(false);

  readonly displayName = computed(
    () =>
      this.conversation().displayName?.trim() ||
      this.conversation().username ||
      'Unknown',
  );

  readonly lastMessagePreview = computed(
    () => this.conversation().lastMessageText?.trim() || 'No messages yet',
  );

  readonly ariaLabel = computed(() => {
    const conv = this.conversation();
    const unread = conv.unreadCount > 0 ? `, ${conv.unreadCount} unread` : '';
    const status = conv.isOnline ? ', online' : '';
    return `${this.displayName()}${status}. ${this.lastMessagePreview()}${unread}`;
  });

  /**
   * True when the current user sent the last message in this conversation —
   * controls the double-checkmark read-receipt shown in the preview row.
   */
  readonly isLastMessageOwn = computed(
    () =>
      !!this.conversation().lastMessageSenderId &&
      this.conversation().lastMessageSenderId === this.currentUserId(),
  );

  /** Icon class for the read-receipt tick in the preview row. */
  readonly previewStatusIcon = computed(() => {
    const conv = this.conversation();
    if (conv.lastMessageReadAt || conv.lastMessageDeliveredAt)
      return 'pi-check-double';
    return 'pi-check';
  });

  /** Whether the last message has been read (controls green color). */
  readonly isPreviewRead = computed(
    () => !!this.conversation().lastMessageReadAt,
  );

  readonly menuItems = computed<MenuItem[]>(() => {
    const id = this.conversation().conversationId;
    return [
      {
        label: 'View profile',
        command: () => this.viewProfile.emit(id),
      },
      {
        label: 'Add to archive',
        command: () => this.archive.emit(id),
      },
      { separator: true },
      {
        label: 'Block',
        styleClass: 'menu-item-danger',
        command: () => this.block.emit(id),
      },
      {
        label: 'Delete',
        styleClass: 'menu-item-danger',
        command: () => this.deleteConv.emit(id),
      },
    ];
  });

  onSelect(): void {
    this.selected.emit(this.conversation().conversationId);
  }

  toggleMenu(event: MouseEvent): void {
    this.itemMenu().toggle(event);
  }

  onMenuShow(): void {
    this.isMenuOpen.set(true);
  }

  onMenuHide(): void {
    this.isMenuOpen.set(false);
  }
}
