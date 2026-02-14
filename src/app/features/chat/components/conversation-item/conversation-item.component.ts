import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Conversation } from '../../models/conversation.model';
import { ConversationTimePipe } from '../../../../shared/pipes/conversation-time.pipe';
import { RelativeTimePipe } from '../../../../shared/pipes/relative-time.pipe';

@Component({
  selector: 'app-conversation-item',
  standalone: true,
  imports: [CommonModule, ConversationTimePipe, RelativeTimePipe],
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

  // use pipes in template for time formatting and tooltips

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
