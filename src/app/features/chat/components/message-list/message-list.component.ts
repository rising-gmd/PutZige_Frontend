import {
  Component,
  Input,
  ChangeDetectionStrategy,
  ViewChild,
  OnChanges,
  SimpleChanges,
  AfterViewChecked,
} from '@angular/core';
import {
  CdkVirtualScrollViewport,
  ScrollingModule,
} from '@angular/cdk/scrolling';
import { isToday, isYesterday, format } from 'date-fns';
import { Message } from '../../models/message.model';
import { MessageBubbleComponent } from '../message-bubble/message-bubble.component';

//  Virtual item discriminated union
// A flat, typed representation of rows rendered by cdkVirtualFor.
// Discriminated by `kind`  no `any`, no type assertions needed in the template.

interface DateDivider {
  readonly kind: 'divider';
  readonly date: string;
}
interface MessageRow {
  readonly kind: 'message';
  readonly message: Message;
  readonly isOwn: boolean;
}

export type VirtualItem = DateDivider | MessageRow;

@Component({
  selector: 'app-message-list',
  standalone: true,
  imports: [ScrollingModule, MessageBubbleComponent],
  templateUrl: './message-list.component.html',
  styleUrls: ['./message-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MessageListComponent implements OnChanges, AfterViewChecked {
  @Input({ required: true }) messages!: Message[];
  @Input({ required: true }) currentUserId!: string;

  @ViewChild(CdkVirtualScrollViewport)
  private readonly viewport?: CdkVirtualScrollViewport;

  /**
   * Estimated item height used by CDK to size the scrollable container and
   * calculate render buffers.  CDK renders extra items above/below the
   * visible area, so visual overflow from taller messages is always covered.
   */
  protected readonly itemSize = 60;

  protected virtualItems: VirtualItem[] = [];

  private prevCount = 0;
  private wasNearBottom = true;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['messages']) {
      this.wasNearBottom = this.isNearBottom();
      this.virtualItems = this.buildVirtualItems(this.messages ?? []);
    }
  }

  ngAfterViewChecked(): void {
    const count = this.virtualItems.length;
    if (count !== this.prevCount) {
      if (this.wasNearBottom) this.scrollToBottom();
      this.prevCount = count;
    }
  }

  /**
   * Stable tracking key for cdkVirtualFor.
   * Dividers are keyed by date string; messages by their immutable id.
   */
  protected trackVirtualItem(_index: number, item: VirtualItem): string {
    return item.kind === 'divider'
      ? `divider:${item.date}`
      : `msg:${item.message.id}`;
  }

  //  Private helpers

  /**
   * Flattens messages into a date-sorted, interspersed list of dividers and
   * message rows.  Inserting dividers here (rather than in a nested loop in the
   * template) keeps the template declarative and avoids re-running date logic
   * on every render cycle.
   */
  private buildVirtualItems(messages: Message[]): VirtualItem[] {
    const sorted = [...messages].sort((a, b) => {
      const toMs = (d: Date | string | undefined | null): number =>
        d instanceof Date ? d.getTime() : new Date(String(d ?? 0)).getTime();
      return toMs(a.sentAt) - toMs(b.sentAt);
    });

    const items: VirtualItem[] = [];
    let lastKey = '';

    for (const msg of sorted) {
      const key = this.dateKey(msg.sentAt);
      if (key !== lastKey) {
        items.push({ kind: 'divider', date: key });
        lastKey = key;
      }
      items.push({
        kind: 'message',
        message: msg,
        isOwn: msg.senderId === this.currentUserId,
      });
    }

    return items;
  }

  private dateKey(sentAt: Date | string | undefined | null): string {
    if (!sentAt) return 'Unknown';
    const d = sentAt instanceof Date ? sentAt : new Date(String(sentAt));
    if (isNaN(d.getTime())) return 'Unknown';
    if (isToday(d)) return 'Today';
    if (isYesterday(d)) return 'Yesterday';
    return format(d, 'MMM d, yyyy');
  }

  /**
   * Scrolls CDK viewport to the last virtual row.
   * `scrollToIndex` is preferred over `scrollToOffset` because CDK knows the
   * exact item position even before the DOM has fully reflowed.
   */
  scrollToBottom(): void {
    this.viewport?.scrollToIndex(this.virtualItems.length - 1, 'smooth');
  }

  /**
   * Returns true when the user is within 200 px of the scroll bottom.
   * CDK's `measureScrollOffset('bottom')` returns the remaining scrollable
   * distance  0 means fully at the bottom.
   */
  private isNearBottom(): boolean {
    if (!this.viewport) return true;
    return this.viewport.measureScrollOffset('bottom') <= 200;
  }
}
