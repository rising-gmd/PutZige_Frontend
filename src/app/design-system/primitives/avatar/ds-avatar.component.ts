import {
  Component,
  ChangeDetectionStrategy,
  computed,
  input,
} from '@angular/core';

/**
 * `ds-avatar`
 *
 * Primitive avatar — image with initials fallback and optional online indicator.
 * Zero business logic. Input/Output only. No service injection.
 *
 * States handled: populated (image), fallback (initials), online/offline dot,
 * xs/sm/md/lg/xl sizes, null/empty name gracefully shown as "?".
 */
@Component({
  selector: 'ds-avatar',
  standalone: true,
  imports: [],
  templateUrl: './ds-avatar.component.html',
  styleUrl: './ds-avatar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    // Not aria-hidden — the outer element carries role/aria-label
    '[attr.aria-hidden]': 'null',
  },
})
export class DsAvatarComponent {
  /**
   * User whose avatar is displayed.
   * `displayName` is preferred for initials; falls back to `name`,
   * then `username` (common on domain models). Renders "?" when all are absent.
   */
  readonly user = input.required<{
    name?: string;
    username?: string;
    displayName?: string;
    profilePictureUrl?: string;
  }>();

  /** Visual size of the avatar. */
  readonly size = input<'xs' | 'sm' | 'md' | 'lg' | 'xl'>('md');

  /** Whether to render the online status indicator dot. */
  readonly showOnline = input(false);

  /** Whether the user is currently online — only visible when `showOnline` is true. */
  readonly isOnline = input(false);

  /** Resolved display label used for alt text and aria-label. */
  protected readonly displayLabel = computed(() => {
    const u = this.user();
    return (
      u.displayName?.trim() || u.name?.trim() || u.username?.trim() || 'Unknown'
    );
  });

  /**
   * Derived initials — max 2 characters, uppercase.
   * Uses `displayName` first, then `name`. Falls back to `?` when both are absent.
   */
  protected readonly initials = computed(() => {
    const label = this.displayLabel();
    if (label === 'Unknown') return '?';
    return label
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => w.charAt(0))
      .join('')
      .slice(0, 2)
      .toUpperCase();
  });
}
