import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatStateService } from '../../services/chat-state.service';
import { AuthService } from '../../../../core/services/auth/auth.service';

@Component({
  selector: 'app-profile-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile-card.component.html',
  styleUrls: ['./profile-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileCardComponent {
  private readonly chatState = inject(ChatStateService);
  readonly currentUser = this.chatState.currentUser;
  private readonly auth = inject(AuthService);

  logout(): void {
    this.auth.logout();
  }

  get avatarText(): string {
    const user = this.currentUser();
    if (!user) return '';
    const name = (user.displayName ?? user.username ?? user.email ?? '')
      .toString()
      .trim();
    if (!name) return '';
    return name
      .split(/\s+/)
      .map((n) => n.charAt(0))
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  openSettings(): void {
    console.log('open settings');
  }
}
