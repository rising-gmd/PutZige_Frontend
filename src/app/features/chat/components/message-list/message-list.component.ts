// ============================================================
// message-list.component.ts
// Path: src/app/features/chat/components/message-list/
// ============================================================
import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  ViewChild,
  ElementRef,
  OnChanges,
  SimpleChanges,
  AfterViewChecked,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Message } from '../../models/message.model';
import { MessageBubbleComponent } from '../message-bubble/message-bubble.component';
// formatConversationTime removed — not used here
import { isToday, isYesterday, format } from 'date-fns';

interface MessageGroup {
  date: string;
  messages: Message[];
}

@Component({
  selector: 'app-message-list',
  standalone: true,
  imports: [CommonModule, MessageBubbleComponent],
  templateUrl: './message-list.component.html',
  styleUrls: ['./message-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MessageListComponent implements OnChanges, AfterViewChecked {
  @Input({ required: true }) messages!: Message[];
  @Input({ required: true }) currentUserId!: string;

  @Output() forward = new EventEmitter<Message>();
  @Output() star = new EventEmitter<Message>();
  @Output() edit = new EventEmitter<Message>();
  @Output() delete = new EventEmitter<Message>();

  @ViewChild('viewport') private viewport?: ElementRef<HTMLDivElement>;

  private readonly cdr = inject(ChangeDetectorRef);

  messageGroups: MessageGroup[] = [];
  private prevCount = 0;
  private wasNearBottom = true;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['messages']) {
      this.wasNearBottom = this.isNearBottom();
      this.messageGroups = this.buildGroups(this.messages ?? []);
      this.cdr.detectChanges();
    }
  }

  ngAfterViewChecked(): void {
    const count = this.messages?.length ?? 0;
    if (count !== this.prevCount) {
      if (this.wasNearBottom) this.scrollToBottom();
      this.prevCount = count;
    }
  }

  // ── Event forwarding ─────────────────────────────────────
  onForward(m: Message) {
    this.forward.emit(m);
  }
  onStar(m: Message) {
    this.star.emit(m);
  }
  onEdit(m: Message) {
    this.edit.emit(m);
  }
  onDelete(m: Message) {
    this.delete.emit(m);
  }

  // ── Date grouping ────────────────────────────────────────

  private buildGroups(messages: Message[]): MessageGroup[] {
    const groups = new Map<string, Message[]>();

    for (const msg of messages) {
      const key = this.getDateKey(msg.sentAt);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(msg);
    }

    return Array.from(groups.entries()).map(([date, msgs]) => ({
      date,
      messages: msgs,
    }));
  }

  private getDateKey(sentAt: Date | string | undefined | null): string {
    if (!sentAt) return 'Unknown';
    const d = sentAt instanceof Date ? sentAt : new Date(sentAt);
    if (isNaN(d.getTime())) return 'Unknown';
    if (isToday(d)) return 'Today';
    if (isYesterday(d)) return 'Yesterday';
    return format(d, 'MMMM d, yyyy');
  }

  // ── Scroll helpers ────────────────────────────────────────

  private isNearBottom(threshold = 150): boolean {
    const el = this.viewport?.nativeElement;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight <= threshold;
  }

  private scrollToBottom(): void {
    const el = this.viewport?.nativeElement;
    if (!el) return;
    try {
      el.scrollTop = el.scrollHeight;
    } catch {
      /* ignore */
    }
  }
}
