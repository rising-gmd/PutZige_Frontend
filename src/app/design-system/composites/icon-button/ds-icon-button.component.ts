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
 * Composite - icon-only action button.
 * Replaces raw button icon patterns across the app.
 * No service injection.
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
        border: calc(var(--space-1) / 4) solid transparent;
        background: transparent;
        border-radius: var(--radius-md);
        color: var(--app-muted);
        cursor: pointer;
        transition:
          background-color var(--transition-fast),
          border-color var(--transition-fast),
          color var(--transition-fast),
          transform var(--transition-fast);
        flex-shrink: 0;

        &:hover:not(:disabled) {
          background-color: var(--app-surface-100);
          color: var(--app-text);
        }

        &:focus-visible {
          outline: calc(var(--space-1) - calc(var(--space-1) / 4)) solid
            var(--p-primary-500);
          outline-offset: calc(var(--space-1) / 2);
        }

        &:active:not(:disabled) {
          transform: scale(0.96);
        }

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        &.is-active {
          color: var(--p-primary-500);
          background-color: var(--app-surface-100);
        }

        &--fab {
          background: var(--p-primary-500);
          color: var(--app-on-primary);
          border-radius: var(--radius-full);

          &:hover:not(:disabled) {
            background: var(--p-primary-600);
            color: var(--app-on-primary);
          }

          &:focus-visible {
            outline-color: var(--p-primary-500);
            outline-offset: calc(var(--space-1) - calc(var(--space-1) / 4));
          }
        }

        &--ghost {
          border-radius: var(--radius-sm);

          &:hover:not(:disabled) {
            background-color: transparent;
            color: var(--p-primary-500);
          }
        }

        &--surface {
          background: var(--app-surface);
          border-color: var(--app-border);
          box-shadow: var(--shadow-xs);

          &:hover:not(:disabled) {
            background: var(--app-surface-100);
            border-color: color-mix(
              in srgb,
              var(--p-primary-500) 35%,
              var(--app-border)
            );
          }
        }

        &--sm {
          width: var(--space-8);
          height: var(--space-8);

          i {
            font-size: var(--font-size-sm);
          }
        }

        &--md {
          width: var(--space-10);
          height: var(--space-10);

          i {
            font-size: var(--font-size-base-rem);
          }
        }

        &--lg {
          width: var(--space-12);
          height: var(--space-12);

          i {
            font-size: var(--font-size-xl);
          }
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DsIconButtonComponent {
  readonly icon = input.required<string>();
  readonly ariaLabel = input.required<string>();
  readonly variant = input<'default' | 'fab' | 'ghost' | 'surface'>('default');
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  readonly disabled = input(false);
  readonly active = input(false);

  readonly clicked = output<MouseEvent>();

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

  focus(): void {
    this.btnRef().nativeElement.focus();
  }

  protected onClicked(event: MouseEvent): void {
    if (!this.disabled()) {
      this.clicked.emit(event);
    }
  }
}
