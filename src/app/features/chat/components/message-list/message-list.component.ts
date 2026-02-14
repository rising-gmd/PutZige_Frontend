import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Message } from '../../models/message.model';
import { MessageTimePipe } from '../../../../shared/pipes/message-time.pipe';

@Component({
  selector: 'app-message-list',
  standalone: true,
  imports: [CommonModule, MessageTimePipe],
  templateUrl: './message-list.component.html',
  styleUrls: ['./message-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MessageListComponent {
  @Input({ required: true }) messages!: Message[];
  @Input({ required: true }) currentUserId!: string;
}
