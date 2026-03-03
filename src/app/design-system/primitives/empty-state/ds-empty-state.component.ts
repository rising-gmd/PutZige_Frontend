import { Component, ChangeDetectionStrategy, input } from '@angular/core';

/**
 * `ds-empty-state`
 *
 * Primitive zero-data placeholder — icon, title, and optional subtitle.
 * Zero business logic. Input only. No service injection.
 */
@Component({
  selector: 'ds-empty-state',
  standalone: true,
  template: `
    <div class="ds-empty-state" role="status">
      <div class="ds-empty-state__icon-wrap" aria-hidden="true">
        <i [class]="'pi ' + icon()"></i>
      </div>
      <p class="ds-empty-state__title">{{ title() }}</p>
      @if (subtitle()) {
        <span class="ds-empty-state__subtitle">{{ subtitle() }}</span>
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
  /** PrimeIcon class name without the `pi` prefix, e.g. `'pi-comments'`. */
  readonly icon = input.required<string>();
  /** Primary label text. */
  readonly title = input.required<string>();
  /** Optional secondary description text. */
  readonly subtitle = input<string | undefined>(undefined);
}
