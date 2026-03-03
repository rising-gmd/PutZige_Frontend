import {
  Component,
  ChangeDetectionStrategy,
  computed,
  input,
} from '@angular/core';

/**
 * `ds-badge`
 *
 * Primitive unread count badge.
 * Renders nothing when count is 0 and visible is true (unless explicitly shown).
 * Zero business logic. Input only. No service injection.
 */
@Component({
  selector: 'ds-badge',
  standalone: true,
  template: `
    @if (visible() && count() > 0) {
      <span
        class="ds-badge"
        role="status"
        [attr.aria-label]="count() + ' unread'"
      >
        {{ displayCount() }}
      </span>
    }
  `,
  styles: [
    `
      .ds-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 20px;
        height: 20px;
        padding: 0 var(--space-1);
        border-radius: var(--radius-full, 9999px);
        background-color: var(--p-primary-500);
        color: var(--app-on-primary, #ffffff);
        font-size: 0.625rem;
        font-weight: 700;
        line-height: 1;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DsBadgeComponent {
  /** The raw count to display. */
  readonly count = input.required<number>();
  /** Maximum count before showing `{max}+`. */
  readonly max = input(99);
  /** Whether the badge is shown at all. */
  readonly visible = input(true);

  /** Capped display value — e.g. `99+` when count > 99. */
  readonly displayCount = computed(() =>
    this.count() > this.max() ? `${this.max()}+` : String(this.count()),
  );
}
