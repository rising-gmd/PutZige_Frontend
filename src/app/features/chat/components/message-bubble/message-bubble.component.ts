import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Message } from '../../models/message.model';
import { formatTime } from '../../utils/date-formatter.util';

@Component({
  selector: 'app-message-bubble',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './message-bubble.component.html',
  styleUrls: ['./message-bubble.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MessageBubbleComponent {
  @Input({ required: true }) message!: Message;
  @Input({ required: true }) isOwnMessage!: boolean;
  @Input() showTimestamp = false;

  get formattedTime(): string {
    return formatTime(this.message.sentAt);
  }

  get statusIcon(): string {
    if (this.message.isOptimistic) return 'pi-clock';
    if (this.message.readAt) return 'pi-check-double';
    if (this.message.deliveredAt) return 'pi-check-double';
    return 'pi-check';
  }

  get statusClass(): string {
    if (this.message.readAt) return 'read';
    if (this.message.deliveredAt) return 'delivered';
    return 'sent';
  }
}
