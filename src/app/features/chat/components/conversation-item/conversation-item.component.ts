import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Conversation } from '../../models/conversation.model';
import { formatRelativeTime } from '../../utils/date-formatter.util';

@Component({
  selector: 'app-conversation-item',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './conversation-item.component.html',
  styleUrls: ['./conversation-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConversationItemComponent {
  @Input({ required: true }) conversation!: Conversation;
  @Input() isActive = false;
  @Output() selected = new EventEmitter<string>();

  get lastMessagePreview(): string {
    return this.conversation.lastMessageText ?? 'No messages yet';
  }

  get relativeTime(): string {
    return formatRelativeTime(new Date(this.conversation.lastActivity));
  }

  get avatarText(): string {
    return (this.conversation.displayName ?? '')
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  onSelect(): void {
    this.selected.emit(this.conversation.userId);
  }
}
