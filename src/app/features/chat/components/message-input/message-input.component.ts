import {
  Component,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { UI_CONSTANTS } from '../../../../core/constants/ui.constants';

/** Delay before emitting typing stopped event (milliseconds) */
const TYPING_DEBOUNCE_MS = UI_CONSTANTS.TYPING_DEBOUNCE_MS;
/** Delay before resetting sending state (milliseconds) */
const SEND_RESET_DELAY_MS = UI_CONSTANTS.SEND_RESET_DELAY_MS;

@Component({
  selector: 'app-message-input',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule],
  templateUrl: './message-input.component.html',
  styleUrls: ['./message-input.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MessageInputComponent {
  @Output() messageSent = new EventEmitter<string>();
  @Output() typingStarted = new EventEmitter<void>();
  @Output() typingStopped = new EventEmitter<void>();

  readonly messageText = signal('');
  readonly isSending = signal(false);

  private typingTimeout?: number;

  onInput(value: string): void {
    this.messageText.set(value);
    if (value.length === 1) this.typingStarted.emit();
    if (this.typingTimeout) clearTimeout(this.typingTimeout);
    if (value.length > 0) {
      this.typingTimeout = window.setTimeout(
        () => this.typingStopped.emit(),
        TYPING_DEBOUNCE_MS,
      );
    } else {
      this.typingStopped.emit();
    }
  }

  onSend(): void {
    const text = this.messageText().trim();
    if (!text || this.isSending()) return;
    this.isSending.set(true);
    this.messageSent.emit(text);
    this.messageText.set('');
    this.typingStopped.emit();
    setTimeout(() => this.isSending.set(false), SEND_RESET_DELAY_MS);
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.onSend();
    }
  }
}
