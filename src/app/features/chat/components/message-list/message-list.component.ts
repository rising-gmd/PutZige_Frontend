import {
  Component,
  Input,
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
import { isToday, isYesterday, format } from 'date-fns';
import { Message } from '../../models/message.model';
import { MessageBubbleComponent } from '../message-bubble/message-bubble.component';

interface DateGroup {
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

  @ViewChild('viewport') private viewport?: ElementRef<HTMLDivElement>;

  private readonly cdr = inject(ChangeDetectorRef);
  messageGroups: DateGroup[] = [];
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

  // ── Date grouping ────────────────────────────────────────

  private buildGroups(messages: Message[]): DateGroup[] {
    const map = new Map<string, Message[]>();

    for (const msg of messages) {
      const key = this.dateKey(msg.sentAt);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(msg);
    }

    return Array.from(map.entries()).map(([date, msgs]) => ({
      date,
      messages: msgs,
    }));
  }

  private dateKey(sentAt: Date | string | undefined | null): string {
    if (!sentAt) return 'Unknown';
    const d = sentAt instanceof Date ? sentAt : new Date(String(sentAt));
    if (isNaN(d.getTime())) return 'Unknown';
    if (isToday(d)) return 'Today';
    if (isYesterday(d)) return 'Yesterday';
    return format(d, 'MMMM d, yyyy');
  }

  // ── Scroll ───────────────────────────────────────────────

  private isNearBottom(threshold = 150): boolean {
    const el = this.viewport?.nativeElement;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight <= threshold;
  }

  private scrollToBottom(): void {
    try {
      const el = this.viewport?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    } catch {
      /* ignore */
    }
  }
}
