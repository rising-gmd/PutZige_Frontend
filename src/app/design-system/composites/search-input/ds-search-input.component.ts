import {
  Component,
  ChangeDetectionStrategy,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  DestroyRef,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

/**
 * `ds-search-input`
 *
 * Composite — styled search input with built-in debounce and a clear button.
 * Replaces raw `<div class="search-field">` patterns throughout the app.
 * No service injection.
 *
 * States handled: empty, populated (shows clear button), focused (ring),
 * disabled, dark mode, long placeholder text, programmatic value reset.
 */
@Component({
  selector: 'ds-search-input',
  standalone: true,
  imports: [],
  templateUrl: './ds-search-input.component.html',
  styleUrl: './ds-search-input.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DsSearchInputComponent {
  @ViewChild('inputRef')
  private readonly inputRef!: ElementRef<HTMLInputElement>;

  /** Current search value (controlled from outside — optional two-way binding). */
  readonly value = input('');
  /** Placeholder text shown when empty. */
  readonly placeholder = input('Search...');
  /**
   * Debounce delay in milliseconds before `valueChange` emits.
   * The clear button always emits immediately, bypassing the debounce.
   * Read once at construction — treated as static for the lifetime of the component.
   */
  readonly debounceMs = input(300);
  /** Whether the input is disabled. */
  readonly disabled = input(false);

  /** Emitted (after debounce) whenever the search value changes. */
  readonly valueChange = output<string>();
  /** Emitted immediately when the user clicks the clear button. */
  readonly cleared = output<void>();

  /** Internal live value — drives both the DOM input and the clear-button visibility. */
  protected readonly rawValue = signal('');
  protected readonly isFocused = signal(false);

  /** Clear button is visible only when there is a value AND the input is enabled. */
  protected readonly showClear = computed(
    () => this.rawValue().length > 0 && !this.disabled(),
  );

  private readonly inputSubject$ = new Subject<string>();
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    // When the parent changes the controlled `value` input (e.g. programmatic
    // clear or URL-driven state), sync it into the internal signal.
    // Guard prevents overwriting the user's live in-flight keystrokes.
    effect(() => {
      const external = this.value();
      if (external !== this.rawValue()) {
        this.rawValue.set(external);
      }
    });

    // One debounced stream for all text input — auto-cleaned on destroy.
    this.inputSubject$
      .pipe(
        debounceTime(this.debounceMs()),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((val) => this.valueChange.emit(val));
  }

  /** Handles native input events — updates internal signal and pushes to debounce. */
  protected onInput(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.rawValue.set(val);
    this.inputSubject$.next(val);
  }

  /**
   * Clears the input immediately — no debounce — and returns focus to the
   * text field so keyboard users are not lost.
   */
  protected onClear(): void {
    this.rawValue.set('');
    this.valueChange.emit('');
    this.cleared.emit();
    this.inputRef?.nativeElement?.focus();
  }

  protected onFocus(): void {
    this.isFocused.set(true);
  }

  protected onBlur(): void {
    this.isFocused.set(false);
  }

  /** Programmatically focus the input (callable from parent via ViewChild). */
  focus(): void {
    this.inputRef?.nativeElement?.focus();
  }
}
