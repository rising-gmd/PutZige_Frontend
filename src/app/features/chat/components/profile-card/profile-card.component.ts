import {
  Component,
  inject,
  ChangeDetectionStrategy,
  ViewChild,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { take } from 'rxjs/operators';
import { SettingsDrawerComponent } from '../settings-drawer/settings-drawer.component';
import { NotificationService } from '../../../../shared/services/notification.service';
import { ChatStateService } from '../../services/chat-state.service';
import { AuthService } from '../../../../core/services/auth/auth.service';

@Component({
  selector: 'app-profile-card',
  standalone: true,
  imports: [CommonModule, TranslateModule, SettingsDrawerComponent],
  templateUrl: './profile-card.component.html',
  styleUrls: ['./profile-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileCardComponent {
  private readonly chatState = inject(ChatStateService);
  private readonly auth = inject(AuthService);
  private readonly notify = inject(NotificationService);
  private readonly translate = inject(TranslateService);

  @ViewChild('settingsDrawer') settingsDrawer!: SettingsDrawerComponent;

  readonly currentUser = this.chatState.currentUser;
  readonly isLoggingOut = signal(false);

  // ── Display helpers ──────────────────────────────────────

  get userDisplayName(): string {
    const u = this.currentUser();
    if (!u) return '';
    return u.displayName?.trim() || u.username || u.email || '';
  }

  get avatarAlt(): string {
    return this.userDisplayName;
  }

  get avatarText(): string {
    return this.userDisplayName
      .split(/\s+/)
      .map((w) => w.charAt(0))
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  // ── Actions ──────────────────────────────────────────────

  openSettings(): void {
    this.settingsDrawer?.open();
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
