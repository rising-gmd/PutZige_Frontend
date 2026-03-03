import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
} from '@angular/core';
import { ButtonModule } from 'primeng/button';

/**
 * `ds-empty-state`
 *
 * Primitive zero-data placeholder — icon, title, optional subtitle,
 * optional action button, and three size variants.
 * Zero business logic. Input/Output only. No service injection.
 *
 * States handled: empty (base), with subtitle, with action button,
 * sm/md/lg sizes, dark mode (inherits surface tokens).
 */
@Component({
  selector: 'ds-empty-state',
  standalone: true,
  imports: [ButtonModule],
  template: `
    <div
      class="ds-empty-state"
      [class]="'ds-empty-state ds-empty-state--' + size()"
      role="status"
    >
      <div class="ds-empty-state__icon-wrap" aria-hidden="true">
        <i [class]="'pi ' + icon()"></i>
      </div>
      <p class="ds-empty-state__title">{{ title() }}</p>
      @if (subtitle()) {
        <span class="ds-empty-state__subtitle">{{ subtitle() }}</span>
      }
      @if (actionLabel()) {
        <p-button
          [label]="actionLabel()!"
          severity="secondary"
          [text]="true"
          size="small"
          (onClick)="action.emit()"
        />
      }
    </div>
  `,
  styles: [
    `
      .ds-empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: var(--space-3);
        padding: var(--space-8);
        text-align: center;
        color: var(--app-text-muted, var(--p-text-muted-color));

        // ── Size variants ──────────────────────────────────
        &--sm {
          gap: var(--space-2);
          padding: var(--space-4);

          .ds-empty-state__icon-wrap {
            width: 32px;
            height: 32px;
            i {
              font-size: 1.25rem;
            }
          }

          .ds-empty-state__title {
            font-size: var(--font-size-sm, 0.75rem);
          }
        }

        &--md {
          gap: var(--space-3);
          padding: var(--space-8);
        }

        &--lg {
          gap: var(--space-4);
          padding: var(--space-12, 3rem);

          .ds-empty-state__icon-wrap {
            width: 64px;
            height: 64px;
            i {
              font-size: 2.5rem;
            }
          }

          .ds-empty-state__title {
            font-size: var(--font-size-lg, 1rem);
          }
        }

        // ── Sub-elements ───────────────────────────────────
        &__icon-wrap {
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;

          i {
            font-size: 2rem;
            opacity: 0.6;
          }
        }

        &__title {
          margin: 0;
          font-size: var(--font-size-md, 0.875rem);
          font-weight: 600;
        }

        &__subtitle {
          font-size: var(--font-size-sm, 0.75rem);
          opacity: 0.75;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DsEmptyStateComponent {
  /** PrimeIcon class name, e.g. `'pi-comments'`. Include the `pi-` prefix. */
  readonly icon = input.required<string>();
  /** Primary label text. */
  readonly title = input.required<string>();
  /** Optional secondary description text. */
  readonly subtitle = input<string | undefined>(undefined);
  /** Visual size variant. */
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  /**
   * When provided, renders a call-to-action button.
   * Pair with the `action` output to handle the click.
   */
  readonly actionLabel = input<string | undefined>(undefined);
  /** Emitted when the optional action button is clicked. */
  readonly action = output<void>();
}
