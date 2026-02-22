import {
  Injectable,
  computed,
  effect,
  inject,
  DestroyRef,
} from '@angular/core';
import { toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { take } from 'rxjs/operators';
import { AuthService } from './auth/auth.service';
import { UserService } from './user.service';
import {
  formatMessageTime,
  formatConversationTime,
  formatRelativeTime,
  formatFullTimestamp,
} from '../utils/date.util';

@Injectable({ providedIn: 'root' })
export class TimezoneService {
  private readonly auth = inject(AuthService);
  private readonly userSignal = toSignal(this.auth.user$, {
    initialValue: null,
  });
  private readonly userService = inject(UserService);
  private readonly destroyRef = inject(DestroyRef);

  readonly currentTimeZoneId = computed(() => {
    // Priority: saved user value (trimmed) -> browser resolved timezone
    const maybeUser = this.auth.getCurrentUser();
    const savedRaw = maybeUser
      ? (maybeUser as unknown as Record<string, unknown>)['timeZoneId']
      : undefined;
    const saved = typeof savedRaw === 'string' ? savedRaw.trim() : '';
    if (saved) return saved;
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  });

  constructor() {
    // FIRST LOGIN AUTO-SAVE: if user has no saved timezone, silently save browser tz
    effect(() => {
      const user = this.userSignal();
      if (!user || typeof user !== 'object') return;
      const asRecord = user as unknown as Record<string, unknown>;
      const tz = (asRecord['timeZoneId'] as string | undefined) ?? '';
      if (!tz || tz.trim() === '') {
        const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        this.userService
          .updateUserPreferences({ timeZoneId: browserTz })
          .pipe(take(1), takeUntilDestroyed(this.destroyRef))
          .subscribe();
      }
    });
  }

  formatMessage(value: Date | string | undefined | null): string {
    return formatMessageTime(value, this.currentTimeZoneId());
  }

  formatConversation(value: Date | string | undefined | null): string {
    return formatConversationTime(value, this.currentTimeZoneId());
  }

  formatRelative(value: Date | string | undefined | null): string {
    return formatRelativeTime(value);
  }

  formatFull(value: Date | string | undefined | null): string {
    return formatFullTimestamp(value, this.currentTimeZoneId());
  }
}
