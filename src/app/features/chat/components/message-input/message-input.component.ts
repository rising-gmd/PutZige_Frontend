import {
  Component,
  ChangeDetectionStrategy,
  signal,
  inject,
  DestroyRef,
  output,
  OnDestroy,
} from '@angular/core';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { TextareaModule } from 'primeng/textarea';
import { ButtonModule } from 'primeng/button';
import { toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { timer } from 'rxjs';
import { debounceTime, distinctUntilChanged, tap } from 'rxjs/operators';
import { UI_CONSTANTS } from '../../../../core/constants/ui.constants';

@Component({
  selector: 'app-message-input',
  imports: [ReactiveFormsModule, TextareaModule, ButtonModule, TranslateModule],
  templateUrl: './message-input.component.html',
  styleUrl: './message-input.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MessageInputComponent implements OnDestroy {
  readonly messageSent = output<string>();
  readonly typingStarted = output<void>();
  readonly typingStopped = output<void>();

  readonly isSending = signal(false);
  readonly messageControl = new FormControl('', { nonNullable: true });
  readonly messageText = toSignal(this.messageControl.valueChanges, {
    initialValue: '',
  });

  private wasTyping = false;
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    // Single pipe handles full typing lifecycle:
    // tap (sync) → start/clear on keystroke; debounce → stop after silence.
    this.messageControl.valueChanges
      .pipe(
        distinctUntilChanged(),
        tap((value) => {
          if (!this.wasTyping && value.length > 0) {
            this.wasTyping = true;
            this.typingStarted.emit();
          }
          if (this.wasTyping && value.length === 0) {
            this.wasTyping = false;
            this.typingStopped.emit();
          }
        }),
        debounceTime(UI_CONSTANTS.TYPING_DEBOUNCE_MS),
        tap(() => this.stopTyping()),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  onSend(): void {
    const text = this.messageControl.value.trim();
    if (!text || this.isSending()) return;

    this.isSending.set(true);
    this.messageSent.emit(text);
    this.messageControl.setValue('');
    this.stopTyping();

    // timer() not setTimeout — auto-cancelled by destroyRef if component unmounts mid-send.
    timer(UI_CONSTANTS.SEND_RESET_DELAY_MS)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.isSending.set(false));
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.onSend();
    }
  }

  // Prevent ghost typing indicator if user navigates away mid-composition.
  ngOnDestroy(): void {
    this.stopTyping();
  }

  private stopTyping(): void {
    if (!this.wasTyping) return;
    this.wasTyping = false;
    this.typingStopped.emit();
  }
}
