import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  viewChild,
} from '@angular/core';
import { Menu, MenuModule } from 'primeng/menu';
import { MenuItem } from 'primeng/api';
import { Conversation } from '../../models/conversation.model';
import { ConversationTimePipe } from '../../../../shared/pipes/conversation-time.pipe';
import { DsAvatarComponent } from '../../../../design-system/primitives/avatar/ds-avatar.component';
import { DsIconButtonComponent } from '../../../../design-system/composites/icon-button/ds-icon-button.component';

@Component({
  selector: 'app-conversation-item',
  standalone: true,
  imports: [
    MenuModule,
    ConversationTimePipe,
    DsAvatarComponent,
    DsIconButtonComponent,
  ],
  templateUrl: './conversation-item.component.html',
  styleUrls: ['./conversation-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConversationItemComponent {
  readonly conversation = input.required<Conversation>();
  readonly isActive = input(false);

  readonly selected = output<string>();
  readonly viewProfile = output<string>();
  readonly archive = output<string>();
  readonly block = output<string>();
  readonly deleteConv = output<string>();

  private readonly itemMenu = viewChild.required<Menu>('itemMenu');

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
}
