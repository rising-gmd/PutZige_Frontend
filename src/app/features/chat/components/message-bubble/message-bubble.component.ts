import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  ViewChild,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Menu, MenuModule } from 'primeng/menu';
import { MenuItem } from 'primeng/api';
import { ImageModule } from 'primeng/image';
import { TooltipModule } from 'primeng/tooltip';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Message, AttachmentType } from '../../models/message.model';
import { MessageTimePipe } from '../../../../shared/pipes/message-time.pipe';
import {
  formatDuration,
  formatSize,
} from '../../../../shared/utils/format.util';

@Component({
  selector: 'app-message-bubble',
  standalone: true,
  imports: [
    CommonModule,
    MenuModule,
    ImageModule,
    TooltipModule,
    MessageTimePipe,
    TranslateModule,
  ],
  templateUrl: './message-bubble.component.html',
  styleUrls: ['./message-bubble.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MessageBubbleComponent {
  @Input({ required: true }) message!: Message;
  @Input({ required: true }) isOwnMessage!: boolean;

  @Output() forward = new EventEmitter<Message>();
  @Output() star = new EventEmitter<Message>();
  @Output() edit = new EventEmitter<Message>();
  @Output() delete = new EventEmitter<Message>();

  @ViewChild('bubbleMenu') private bubbleMenu!: Menu;

  // Expose enum to the template so @switch can reference its cases.
  protected readonly AttachmentType = AttachmentType;

  // Expose pure formatting utils to the template — sourced from shared/utils.
  protected readonly formatDuration = formatDuration;
  protected readonly formatSize = formatSize;

  private readonly translate = inject(TranslateService);

  // Tracks PrimeNG menu open state for aria-expanded binding and .menu-open CSS class.
  protected menuVisible = false;

  // Images shown in grid before the "+N" overflow badge appears.
  private static readonly MAX_VISIBLE_IMAGES = 4;

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

  // ── Context menu ──────────────────────────────────────

  get menuItems(): MenuItem[] {
    const items: MenuItem[] = [
      {
        label: this.translate.instant('messaging.action_forward'),
        command: () => this.forward.emit(this.message),
      },
      {
        label: this.translate.instant('messaging.action_star'),
        command: () => this.star.emit(this.message),
      },
    ];

    if (this.isOwnMessage) {
      items.push({
        label: this.translate.instant('messaging.action_edit'),
        command: () => this.edit.emit(this.message),
      });
    }

    items.push(
      { separator: true },
      {
        label: this.translate.instant('messaging.action_delete'),
        styleClass: 'menu-item-danger',
        command: () => this.delete.emit(this.message),
      },
    );

    return items;
  }

  toggleMenu(event: Event): void {
    this.bubbleMenu.toggle(event);
  }

  // ── Attachment helpers ──────────────────────────────────────────

  /**
   * IMAGE attachments capped at MAX_VISIBLE_IMAGES for the grid.
   * Hidden extras are counted by hiddenImageCount.
   */
  get visibleImages(): NonNullable<Message['attachments']> {
    return (
      this.message.attachments
        ?.filter((a) => a.type === AttachmentType.IMAGE)
        .slice(0, MessageBubbleComponent.MAX_VISIBLE_IMAGES) ?? []
    );
  }

  /**
   * Count of IMAGE attachments hidden behind the "+N" overflow badge.
   * Returns 0 when all images fit within MAX_VISIBLE_IMAGES.
   */
  get hiddenImageCount(): number {
    const total =
      this.message.attachments?.filter((a) => a.type === AttachmentType.IMAGE)
        .length ?? 0;
    return Math.max(0, total - MessageBubbleComponent.MAX_VISIBLE_IMAGES);
  }

  /**
   * Non-image attachments (VIDEO, AUDIO, FILE) rendered below the image grid.
   */
  get nonImageAttachments(): NonNullable<Message['attachments']> {
    return (
      this.message.attachments?.filter(
        (a) => a.type !== AttachmentType.IMAGE,
      ) ?? []
    );
  }

  /**
   * True when there are 2 or more visible IMAGE attachments.
   * Drives the 2-column CSS grid layout in the template.
   */
  get hasMultipleImages(): boolean {
    return this.visibleImages.length > 1;
  }
}
