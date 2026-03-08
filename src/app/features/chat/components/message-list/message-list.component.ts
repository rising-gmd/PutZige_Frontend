import {
  Component,
  Input,
  ChangeDetectionStrategy,
  ViewChild,
  OnChanges,
  SimpleChanges,
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
export class MessageListComponent implements OnChanges {
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

  private scrollPending = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['messages']) return;

    const prev = (changes['messages'].previousValue ?? []) as Message[];
    const curr = (changes['messages'].currentValue ?? []) as Message[];

    // Measure near-bottom BEFORE rebuilding items (viewport not yet updated).
    const isFirstLoad = changes['messages'].firstChange;
    const isConversationSwitch =
      !isFirstLoad &&
      prev.length > 0 &&
      curr.length > 0 &&
      prev[0]?.conversationId !== curr[0]?.conversationId;

    const shouldScroll =
      isFirstLoad || isConversationSwitch || this.isNearBottom();
    const behavior: ScrollBehavior =
      isFirstLoad || isConversationSwitch ? 'instant' : 'smooth';

    this.virtualItems = this.buildVirtualItems(curr);

    if (shouldScroll && !this.scrollPending) {
      this.scrollPending = true;
      // CDK virtual scroll needs two ticks on initial load / conversation switch:
      // tick 1 — CDK processes the new items array
      // tick 2 — CDK renders rows; then we scroll to actual scrollHeight (not
      //          estimated index) so variable-height bubbles don't cause undershoot.
      const doScroll = () => {
        this.scrollPending = false;
        const el = this.viewport?.elementRef.nativeElement as
          | HTMLElement
          | undefined;
        if (!el) return;
        el.scrollTo({ top: el.scrollHeight, behavior });
      };
      if (isFirstLoad || isConversationSwitch) {
        setTimeout(() => setTimeout(doScroll));
      } else {
        setTimeout(doScroll);
      }
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
    setTimeout(() => {
      const el = this.viewport?.elementRef.nativeElement as
        | HTMLElement
        | undefined;
      if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    });
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
