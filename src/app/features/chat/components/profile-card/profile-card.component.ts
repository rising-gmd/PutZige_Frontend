import {
  Component,
  inject,
  ChangeDetectionStrategy,
  ViewChild,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { SettingsDrawerComponent } from '../settings-drawer/settings-drawer.component';
import { NotificationService } from '../../../../shared/services/notification.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { take } from 'rxjs/operators';
import { ChatStateService } from '../../services/chat-state.service';
import { AuthService } from '../../../../core/services/auth/auth.service';

@Component({
  selector: 'app-profile-card',
  standalone: true,
  imports: [
    CommonModule,
    SettingsDrawerComponent,
    // AppButtonComponent removed — using icon-only buttons
    TranslateModule,
  ],
  templateUrl: './profile-card.component.html',
  styleUrls: ['./profile-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileCardComponent {
  private readonly chatState = inject(ChatStateService);
  readonly currentUser = this.chatState.currentUser;
  private readonly auth = inject(AuthService);
  private readonly notification = inject(NotificationService);
  private readonly translate = inject(TranslateService);
  readonly isLoggingOut = signal(false);

  @ViewChild('settingsDrawer')
  settingsDrawer!: import('../settings-drawer/settings-drawer.component').SettingsDrawerComponent;

  logout(): void {
    this.isLoggingOut.set(true);
    this.auth
      .logout()
      .pipe(take(1))
      .subscribe({
        next: () => {
          this.notification.showSuccess(
            this.translate.instant('auth.logout_success'),
          );
          this.isLoggingOut.set(false);
        },
        error: () => {
          this.notification.showError(
            this.translate.instant('auth.logout_error'),
          );
          this.isLoggingOut.set(false);
        },
      });
  }

  get avatarText(): string {
    const user = this.currentUser();
    if (!user) return '';
    const name = (
      user.displayName?.trim() ||
      user.username ||
      user.email ||
      ''
    ).toString();
    if (!name) return '';
    return name
      .split(/\s+/)
      .map((n) => n.charAt(0))
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  openSettings(): void {
    this.settingsDrawer?.open();
  }
}
