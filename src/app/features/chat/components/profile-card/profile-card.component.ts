import {
  Component,
  inject,
  ChangeDetectionStrategy,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { SettingsDrawerComponent } from '../settings-drawer/settings-drawer.component';
import { AppButtonComponent } from '../../../../shared/components/app-button/app-button.component';
import { TranslateModule } from '@ngx-translate/core';
import { ChatStateService } from '../../services/chat-state.service';
import { AuthService } from '../../../../core/services/auth/auth.service';

@Component({
  selector: 'app-profile-card',
  standalone: true,
  imports: [
    CommonModule,
    SettingsDrawerComponent,
    AppButtonComponent,
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

  @ViewChild('settingsDrawer')
  settingsDrawer!: import('../settings-drawer/settings-drawer.component').SettingsDrawerComponent;

  logout(): void {
    this.auth.logout();
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
