import {
  Component,
  inject,
  OnInit,
  ChangeDetectionStrategy,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConversationListComponent } from '../conversation-list/conversation-list.component';
import { ChatAreaComponent } from '../chat-area/chat-area.component';
import { ProfileCardComponent } from '../profile-card/profile-card.component';
import { ChatStateService } from '../../services/chat-state.service';

@Component({
  selector: 'app-chat-container',
  standalone: true,
  imports: [
    CommonModule,
    ConversationListComponent,
    ChatAreaComponent,
    ProfileCardComponent,
  ],
  templateUrl: './chat-container.component.html',
  styleUrls: ['./chat-container.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatContainerComponent implements OnInit {
  private readonly chatState = inject(ChatStateService);

  /** Controls sidebar visibility on mobile */
  readonly sidebarOpen = signal(false);

  async ngOnInit(): Promise<void> {
    await this.chatState.initialize();
  }

  toggleSidebar(): void {
    this.sidebarOpen.update((v) => !v);
  }
}
