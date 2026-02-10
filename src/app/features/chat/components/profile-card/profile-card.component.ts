import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatStateService } from '../../services/chat-state.service';

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

  get avatarText(): string {
    const user = this.currentUser();
    if (!user) return '';
    return user.displayName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  openSettings(): void {
    console.log('open settings');
  }
}
