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
export class MessageListComponent implements OnChanges, AfterViewChecked {
  @Input({ required: true }) messages!: Message[];
  @Input({ required: true }) currentUserId!: string;
  @ViewChild('viewport') private viewport?: ElementRef<HTMLDivElement>;

  private readonly cdr = inject(ChangeDetectorRef);
  private prevMessageCount = 0;
  private wasNearBottomBeforeUpdate = true;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['messages']) {
      this.wasNearBottomBeforeUpdate = this.isNearBottom();
      this.cdr.detectChanges();
    }
  }

  ngAfterViewChecked(): void {
    if (!this.messages) return;
    if (this.messages.length !== this.prevMessageCount) {
      if (this.wasNearBottomBeforeUpdate) {
        this.scrollToBottom();
      }
      this.prevMessageCount = this.messages.length;
    }
  }

  private isNearBottom(threshold = 150): boolean {
    try {
      const el = this.viewport?.nativeElement;
      if (!el) return true;
      const fromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      return fromBottom <= threshold;
    } catch {
      return true;
    }
  }

  private scrollToBottom(): void {
    try {
      const el = this.viewport?.nativeElement;
      if (!el) return;
      el.scrollTop = el.scrollHeight;
    } catch {
      // ignore
    }
  }
}
