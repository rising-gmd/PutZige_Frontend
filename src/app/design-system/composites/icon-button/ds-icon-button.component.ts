import {
  Component,
  ChangeDetectionStrategy,
  computed,
  input,
  output,
  viewChild,
  ElementRef,
} from '@angular/core';

/**
 * `ds-icon-button`
 *
 * Composite — icon-only action button.
 * Replaces raw `<button class="header-action-btn">`, `.fab-btn`, and
 * similar patterns throughout the app.
 * No service injection.
 *
 * States handled: default, hover, focus, disabled, active (toggle),
 * three variants (default, fab, ghost), three sizes (sm, md, lg),
 * dark mode (inherits surface tokens).
 */
@Component({
  selector: 'ds-icon-button',
  standalone: true,
  template: `
    <button
      #btnRef
      [class]="hostClass()"
      type="button"
      [disabled]="disabled()"
      [attr.aria-label]="ariaLabel()"
      [attr.aria-pressed]="active() ? true : null"
      [attr.title]="ariaLabel()"
      (click)="onClicked($event)"
    >
      <i [class]="'pi ' + icon()" aria-hidden="true"></i>
    </button>
  `,
  styles: [
    `
      .ds-icon-button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border: none;
        background: transparent;
        border-radius: var(--radius-sm, 6px);
        color: var(--app-text-muted, var(--p-text-muted-color));
        cursor: pointer;
        transition:
          background-color 150ms ease,
          color 150ms ease,
          transform 100ms ease;
        flex-shrink: 0;

        &:hover:not(:disabled) {
          background-color: var(--app-surface-100, rgba(255, 255, 255, 0.08));
          color: var(--app-text, var(--p-text-color));
        }

        &:focus-visible {
          outline: 3px solid var(--p-primary-500);
          outline-offset: 2px;
        }

        &:active:not(:disabled) {
          transform: scale(0.93);
        }

        &:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        // ── Active / pressed toggle state ──────────────────
        &.is-active {
          color: var(--p-primary-500);
          background-color: var(--app-surface-100, rgba(255, 255, 255, 0.08));
        }

        // ── Variant: fab (floating action button) ──────────
        &--fab {
          background: var(--p-primary-500);
          color: var(--app-on-primary, #ffffff);
          border-radius: var(--radius-full, 9999px);

          &:hover:not(:disabled) {
            background: var(--p-primary-600);
            color: var(--app-on-primary, #ffffff);
          }

          &:focus-visible {
            outline-color: var(--p-primary-500);
            outline-offset: 3px;
          }
        }

        // ── Variant: ghost (text-link style) ──────────────
        &--ghost {
          border-radius: var(--radius-sm, 6px);

          &:hover:not(:disabled) {
            background-color: transparent;
            color: var(--p-primary-500);
          }
        }

        // ── Size variants ──────────────────────────────────
        &--sm {
          width: 28px;
          height: 28px;
          i {
            font-size: 0.875rem;
          }
        }

        &--md {
          width: 36px;
          height: 36px;
          i {
            font-size: 1rem;
          }
        }

        &--lg {
          width: 44px;
          height: 44px;
          i {
            font-size: 1.25rem;
          }
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DsIconButtonComponent {
  /** PrimeIcon class, e.g. `'pi-video'`. Must include the `pi-` prefix. */
  readonly icon = input.required<string>();
  /** Accessible label — required for icon-only buttons (WCAG 1.1.1). */
  readonly ariaLabel = input.required<string>();
  /**
   * Visual style variant.
   * - `default` — subtle hover only (used in headers/toolbars)
   * - `fab` — filled primary circle (used for primary actions)
   * - `ghost` — transparent hover, text-link feel
   */
  readonly variant = input<'default' | 'fab' | 'ghost'>('default');
  /** Visual size. */
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  /** Whether the button is disabled. */
  readonly disabled = input(false);
  /** Whether the button is in an active/pressed state — sets aria-pressed. */
  readonly active = input(false);
  /**
   * Emitted on click when not disabled.
   * Exposes the native `MouseEvent` so callers that need to position a
   * PrimeNG popup (e.g. `p-menu.toggle(event)`) can do so without an extra
   * host listener. Callers that don't need it simply omit `$event`.
   */
  readonly clicked = output<MouseEvent>();

  /** Composed class string — avoids static+dynamic class merge ambiguity. */
  protected readonly hostClass = computed(() => {
    const classes = [
      'ds-icon-button',
      `ds-icon-button--${this.size()}`,
      `ds-icon-button--${this.variant()}`,
    ];
    if (this.active()) classes.push('is-active');
    return classes.join(' ');
  });

  private readonly btnRef =
    viewChild.required<ElementRef<HTMLButtonElement>>('btnRef');

  /** Programmatically focus the underlying button — use after closing a modal. */
  focus(): void {
    this.btnRef().nativeElement.focus();
  }

  protected onClicked(event: MouseEvent): void {
    if (!this.disabled()) {
      this.clicked.emit(event);
    }
  }
}
