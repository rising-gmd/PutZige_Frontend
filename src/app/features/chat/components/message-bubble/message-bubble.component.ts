import { MenuItem } from 'primeng/api';
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
import { Message } from '../../models/message.model';
import { MessageTimePipe } from '../../../../shared/pipes/message-time.pipe';

@Component({
  selector: 'app-message-bubble',
  standalone: true,
  imports: [CommonModule, MenuModule, MessageTimePipe],
  templateUrl: './message-bubble.component.html',
  styleUrls: ['./message-bubble.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MessageBubbleComponent {
  @Input({ required: true }) message!: Message;
  @Input({ required: true }) isOwnMessage!: boolean;
  @Input() showFooter = true;

  @Output() forward = new EventEmitter<Message>();
  @Output() star = new EventEmitter<Message>();
  @Output() edit = new EventEmitter<Message>();
  @Output() delete = new EventEmitter<Message>();

  @ViewChild('bubbleMenu') private bubbleMenu!: Menu;

  menuVisible = false;

  // ── Read receipt icon ────────────────────────────────────

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

  get bubbleAriaLabel(): string {
    const who = this.isOwnMessage ? 'You' : 'Other';
    return `${who}: ${this.message.messageText}`;
  }

  // ── Context menu ─────────────────────────────────────────

  get menuItems(): MenuItem[] {
    const items: MenuItem[] = [
      {
        label: 'Forward',
        icon: 'pi pi-share-alt',
        command: () => this.forward.emit(this.message),
      },
      {
        label: 'Star',
        icon: 'pi pi-star',
        command: () => this.star.emit(this.message),
      },
    ];

    if (this.isOwnMessage) {
      items.push(
        {
          label: 'Edit',
          icon: 'pi pi-pencil',
          command: () => this.edit.emit(this.message),
        },
        { separator: true },
        {
          label: 'Delete',
          icon: 'pi pi-trash',
          styleClass: 'menu-item-danger',
          command: () => this.delete.emit(this.message),
        },
      );
    }

    return items;
  }

  toggleMenu(event: Event): void {
    this.bubbleMenu.toggle(event);
  }
}
