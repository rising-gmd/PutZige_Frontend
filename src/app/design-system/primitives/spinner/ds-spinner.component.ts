import { Component, ChangeDetectionStrategy, input } from '@angular/core';

/**
 * `ds-spinner`
 *
 * Primitive loading indicator using PrimeIcons.
 * Zero business logic. Use for any async loading state.
 */
@Component({
  selector: 'ds-spinner',
  standalone: true,
  template: `
    <div
      class="ds-spinner"
      [class]="'ds-spinner--' + size()"
      role="status"
      [attr.aria-label]="ariaLabel()"
      [attr.aria-busy]="true"
    >
      <i class="pi pi-spin pi-spinner ds-spinner__icon" aria-hidden="true"></i>
    </div>
  `,
  styles: [
    `
      :host {
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }

      .ds-spinner {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        color: var(--p-primary-500);

        &--sm .ds-spinner__icon {
          font-size: 1rem;
        }
        &--md .ds-spinner__icon {
          font-size: 1.5rem;
        }
        &--lg .ds-spinner__icon {
          font-size: 2rem;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DsSpinnerComponent {
  /** Visual size of the spinner. */
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  /** Screen-reader label for the loading state. */
  readonly ariaLabel = input('Loading');
}
