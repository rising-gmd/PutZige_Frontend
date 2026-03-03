import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Menu, MenuModule } from 'primeng/menu';
import { MenuItem } from 'primeng/api';
import { Conversation } from '../../models/conversation.model';
import { ConversationTimePipe } from '../../../../shared/pipes/conversation-time.pipe';

@Component({
  selector: 'app-conversation-item',
  standalone: true,
  imports: [CommonModule, MenuModule, ConversationTimePipe],
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

  get displayName(): string {
    return (
      this.conversation.displayName?.trim() ||
      this.conversation.username ||
      'Unknown'
    );
  }

  get avatarText(): string {
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

  get ariaLabel(): string {
    const unread =
      this.conversation.unreadCount > 0
        ? `, ${this.conversation.unreadCount} unread`
        : '';
    const status = this.conversation.isOnline ? ', online' : '';
    return `${this.displayName}${status}. ${this.lastMessagePreview}${unread}`;
  }

  get menuItems(): MenuItem[] {
    return [
      {
        label: 'View profile',
        command: () => this.viewProfile.emit(this.conversation.conversationId),
      },
      {
        label: 'Add to archive',
        command: () => this.archive.emit(this.conversation.conversationId),
      },
      { separator: true },
      {
        label: 'Block',
        styleClass: 'menu-item-danger',
        command: () => this.block.emit(this.conversation.conversationId),
      },
      {
        label: 'Delete',
        styleClass: 'menu-item-danger',
        command: () => this.deleteConv.emit(this.conversation.conversationId),
      },
    ];
  }

  onSelect(): void {
    this.selected.emit(this.conversation.conversationId);
  }

  toggleMenu(event: Event): void {
    this.itemMenu.toggle(event);
  }
}
