import {
  Component,
  ChangeDetectionStrategy,
  computed,
  input,
} from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * `ds-avatar`
 *
 * Primitive avatar — image with initials fallback and optional online indicator.
 * Zero business logic. Input/Output only. No service injection.
 */
@Component({
  selector: 'ds-avatar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ds-avatar.component.html',
  styleUrl: './ds-avatar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.aria-hidden]': 'null',
  },
})
export class DsAvatarComponent {
  /** User whose avatar is displayed. `name` is used for alt text and initials fallback. */
  readonly user = input.required<{
    name: string;
    profilePictureUrl?: string;
  }>();
  /** Visual size of the avatar. */
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  /** Whether to render the online status indicator ring. */
  readonly showOnline = input(false);
  /** Whether the user is currently online (only visible when showOnline is true). */
  readonly isOnline = input(false);

  /** Derived initials from the user name — max 2 characters. */
  readonly initials = computed(() =>
    this.user()
      .name.split(/\s+/)
      .map((w) => w.charAt(0))
      .join('')
      .slice(0, 2)
      .toUpperCase(),
  );
}
