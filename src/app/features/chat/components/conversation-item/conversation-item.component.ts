import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Conversation } from '../../models/conversation.model';
import { ConversationTimePipe } from '../../../../shared/pipes/conversation-time.pipe';
import { RelativeTimePipe } from '../../../../shared/pipes/relative-time.pipe';
import { Menu, MenuModule } from 'primeng/menu';
import { MenuItem } from 'primeng/api';

@Component({
  selector: 'app-conversation-item',
  standalone: true,
  imports: [CommonModule, MenuModule, ConversationTimePipe, RelativeTimePipe],
  templateUrl: './conversation-item.component.html',
  styleUrls: ['./conversation-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConversationItemComponent {
  @Input({ required: true }) conversation!: Conversation;
  @Input() isActive = false;

  @Output() selected = new EventEmitter<string>();
  @Output() viewProfile = new EventEmitter<string>();
  @Output() archive = new EventEmitter<string>();
  @Output() block = new EventEmitter<string>();
  @Output() deleteConv = new EventEmitter<string>();

  @ViewChild('itemMenu') private itemMenu!: Menu;

  menuVisible = false;

  // ── Derived display values ──────────────────────────────

  get displayName(): string {
    return (
      this.conversation.displayName?.trim() ||
      this.conversation.username ||
      'Unknown'
    );
  }

  get avatarInitials(): string {
    return this.displayName
      .split(/\s+/)
      .map((w) => w.charAt(0))
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  get lastMessagePreview(): string {
    return this.conversation.lastMessageText?.trim() || 'No messages yet';
  }

  get itemAriaLabel(): string {
    const unread =
      this.conversation.unreadCount > 0
        ? `, ${this.conversation.unreadCount} unread`
        : '';
    const online = this.conversation.isOnline ? ', online' : '';
    return `${this.displayName}${online}. ${this.lastMessagePreview}${unread}`;
  }

  /** Show read receipt icon only when there are messages */
  get showReadIcon(): boolean {
    return !!this.conversation.lastMessageText;
  }

  /** pi-check = sent, pi-check-double = delivered/read */
  get readIconClass(): string {
    if (this.conversation.lastMessageReadAt) return 'pi-check-double';
    if (this.conversation.lastMessageDeliveredAt) return 'pi-check-double';
    return 'pi-check';
  }

  // ── Context menu items ──────────────────────────────────

  get menuItems(): MenuItem[] {
    return [
      {
        label: 'View profile',
        icon: 'pi pi-user',
        command: () => this.viewProfile.emit(this.conversation.conversationId),
      },
      {
        label: 'Add to archive',
        icon: 'pi pi-inbox',
        command: () => this.archive.emit(this.conversation.conversationId),
      },
      { separator: true },
      {
        label: 'Block',
        icon: 'pi pi-ban',
        styleClass: 'menu-item-danger',
        command: () => this.block.emit(this.conversation.conversationId),
      },
      {
        label: 'Delete',
        icon: 'pi pi-trash',
        styleClass: 'menu-item-danger',
        command: () => this.deleteConv.emit(this.conversation.conversationId),
      },
    ];
  }

  // ── Event handlers ──────────────────────────────────────

  onSelect(): void {
    this.selected.emit(this.conversation.conversationId);
  }

  toggleMenu(event: Event): void {
    // Prevent the parent click handler from also triggering a selection
    try {
      event.stopPropagation();
    } catch (e) {
      void e;
    }
    this.itemMenu.toggle(event);
  }
}
