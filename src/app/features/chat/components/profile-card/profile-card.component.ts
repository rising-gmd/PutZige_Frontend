import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { take } from 'rxjs/operators';
import { SettingsDrawerComponent } from '../settings-drawer/settings-drawer.component';
import { NotificationService } from '../../../../shared/services/notification.service';
import { ChatStateService } from '../../services/chat-state.service';
import { AuthService } from '../../../../core/services/auth/auth.service';
import { DsAvatarComponent } from '../../../../design-system/primitives/avatar/ds-avatar.component';
import { DsIconButtonComponent } from '../../../../design-system/composites/icon-button/ds-icon-button.component';

@Component({
  selector: 'app-profile-card',
  standalone: true,
  imports: [
    TranslateModule,
    SettingsDrawerComponent,
    DsAvatarComponent,
    DsIconButtonComponent,
  ],
  templateUrl: './profile-card.component.html',
  styleUrls: ['./profile-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileCardComponent {
  private readonly chatState = inject(ChatStateService);
  private readonly auth = inject(AuthService);
  private readonly notify = inject(NotificationService);
  private readonly translate = inject(TranslateService);

  private readonly drawerRef =
    viewChild<SettingsDrawerComponent>('settingsDrawer');

  readonly currentUser = this.chatState.currentUser;
  readonly isLoggingOut = signal(false);

  /** Used for aria-label only — ds-avatar derives its own display label internally. */
  readonly userDisplayName = computed(() => {
    const u = this.currentUser();
    if (!u) return '';
    return u.displayName?.trim() || u.username || u.email || '';
  });

  // ── Actions ──────────────────────────────────────────────

  openSettings(): void {
    this.drawerRef()?.open();
  }

  logout(): void {
    this.isLoggingOut.set(true);
    this.auth
      .logout()
      .pipe(take(1))
      .subscribe({
        next: () => {
          this.notify.showSuccess(
            this.translate.instant('auth.logout_success'),
          );
          this.isLoggingOut.set(false);
        },
        error: () => {
          this.notify.showError(this.translate.instant('auth.logout_error'));
          this.isLoggingOut.set(false);
        },
      });
  }
}
