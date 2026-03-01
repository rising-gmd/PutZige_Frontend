import {
  Component,
  inject,
  ChangeDetectionStrategy,
  signal,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConversationItemComponent } from '../conversation-item/conversation-item.component';
import { NewChatModalComponent } from '../new-chat-modal.component';
import { ChatStateService } from '../../services/chat-state.service';
import { User } from '../../models/user.model';
import { UserSearchResult } from '../../models/new-chat.models';
import { NotificationService } from '../../../../shared/services/notification.service';

@Component({
  selector: 'app-conversation-list',
  standalone: true,
  imports: [CommonModule, ConversationItemComponent, NewChatModalComponent],
  templateUrl: './conversation-list.component.html',
  styleUrls: ['./conversation-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConversationListComponent {
  @ViewChild('newChatModal') private newChatModal!: NewChatModalComponent;

  private readonly chatState = inject(ChatStateService);
  private readonly notify = inject(NotificationService);

  readonly conversations = this.chatState.sortedConversations;
  readonly activeConversationId = this.chatState.activeConversationId;
  readonly isLoading = this.chatState.isLoadingConversations;
  readonly searchResults = this.chatState.searchResults;
  readonly searchQuery = signal('');

  // ── Actions ─────────────────────────────────────────────

  showNewChatModal(): void {
    this.newChatModal?.show();
  }

  onSearch(query: string): void {
    this.searchQuery.set(query);
    if (query.trim().length >= 1) {
      this.chatState.searchUsers(query);
    }
  }

  onSelectConversation(conversationId: string): void {
    this.chatState.setActiveConversation(conversationId);
  }

  onSelectUser(user: User): void {
    this.chatState.startConversation(user);
    this.searchQuery.set('');
  }

  onUserSelected(user: UserSearchResult): void {
    const conv = this.chatState
      .conversations()
      .find((c) => c.userId === user.id);
    if (conv) {
      this.chatState.setActiveConversation(conv.conversationId);
    }
  }

  onModalClosed(): void {
    // Focus the FAB after modal closes for keyboard users
  }

  // ── Context menu handlers ────────────────────────────────

  onViewProfile(): void {
    // TODO: navigate to profile page
  }

  onArchive(): void {
    // TODO: call chatState.archiveConversation()
  }

  onBlock(): void {
    // TODO: call chatState.blockUser()
  }

  onDelete(): void {
    // TODO: call chatState.deleteConversation() with confirm dialog
  }
}
