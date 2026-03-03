import {
  Component,
  inject,
  OnInit,
  ChangeDetectionStrategy,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { ConversationListComponent } from '../conversation-list/conversation-list.component';
import { ChatAreaComponent } from '../chat-area/chat-area.component';
import { ProfileCardComponent } from '../profile-card/profile-card.component';
import { ChatActions } from '../../../../store/chat/chat.actions';

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
  private readonly store = inject(Store);

  /** Controls sidebar visibility on mobile */
  readonly sidebarOpen = signal(false);

  ngOnInit(): void {
    // Triggers getCurrentUser + getConversations + SignalR connect via effects.
    this.store.dispatch(ChatActions.pageOpened());
  }

  toggleSidebar(): void {
    this.sidebarOpen.update((v) => !v);
  }
}
