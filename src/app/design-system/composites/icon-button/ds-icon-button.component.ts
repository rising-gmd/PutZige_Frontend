import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
} from '@angular/core';

/**
 * `ds-icon-button`
 *
 * Composite — icon-only action button.
 * Replaces raw `<button class="header-action-btn">` patterns throughout the app.
 * No service injection.
 */
@Component({
  selector: 'ds-icon-button',
  standalone: true,
  template: `
    <button
      class="ds-icon-button"
      [class]="'ds-icon-button--' + size()"
      type="button"
      [disabled]="disabled()"
      [attr.aria-label]="ariaLabel()"
      [attr.title]="ariaLabel()"
      (click)="onClicked()"
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
          color 150ms ease;

        &:hover:not(:disabled) {
          background-color: var(--app-surface-100, rgba(255, 255, 255, 0.08));
          color: var(--app-text, var(--p-text-color));
        }

        &:focus-visible {
          outline: 3px solid var(--p-primary-500);
          outline-offset: 2px;
        }

        &:disabled {
          opacity: 0.4;
          cursor: not-allowed;
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
  /** Accessible label — required for icon-only buttons. */
  readonly ariaLabel = input.required<string>();
  /** Visual size of the button. */
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  /** Whether the button is disabled. */
  readonly disabled = input(false);
  /** Emitted on click when not disabled. */
  readonly clicked = output<void>();

  protected onClicked(): void {
    if (!this.disabled()) {
      this.clicked.emit();
    }
  }
}
