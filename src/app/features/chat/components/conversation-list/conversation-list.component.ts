import {
  Component,
  inject,
  ChangeDetectionStrategy,
  signal,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { ConversationItemComponent } from '../conversation-item/conversation-item.component';
import { AppIconFieldComponent } from '../../../../shared/components/icon-field/app-icon-field.component';
import { NewChatModalComponent } from '../new-chat-modal.component';
import { ChatStateService } from '../../services/chat-state.service';
import { User } from '../../models/user.model';
import { UserSearchResult } from '../../models/new-chat.models';

@Component({
  selector: 'app-conversation-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    InputTextModule,
    ButtonModule,
    ConversationItemComponent,
    AppIconFieldComponent,
    NewChatModalComponent,
  ],
  templateUrl: './conversation-list.component.html',
  styleUrls: ['./conversation-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConversationListComponent {
  @ViewChild('newChatModal') newChatModal!: NewChatModalComponent;
  private readonly chatState = inject(ChatStateService);

  readonly conversations = this.chatState.sortedConversations;
  readonly activeConversationId = this.chatState.activeConversationId;
  readonly isLoading = this.chatState.isLoadingConversations;
  readonly searchQuery = signal('');
  readonly searchResults = this.chatState.searchResults;

  trackByConversation(index: number, item: { id: string }) {
    return item.id;
  }

  showNewChatModal(): void {
    this.newChatModal?.show?.();
  }

  // Accept the emitted UserSearchResult from the modal and convert to project User
  onUserSelected(user: UserSearchResult): void {
    const chatUser: User = {
      id: user.id,
      username: user.username || user.displayName || '',
      email: user.email || '',
      displayName: user.displayName || user.username || '',
      profilePictureUrl: user.profilePictureUrl,
      isOnline: user.isOnline ?? false,
    };

    this.chatState.startConversation(chatUser);
  }

  trackByUser(_index: number, item: UserSearchResult) {
    return item.id;
  }

  onModalClosed(): void {
    // return focus or any cleanup can go here
  }

  onSelectConversation(conversationId: string): void {
    this.chatState.setActiveConversation(conversationId);
  }

  onSearch(query: string): void {
    this.searchQuery.set(query);
    this.chatState.searchUsers(query);
  }

  onSelectUser(user: User): void {
    this.chatState.startConversation(user);
    this.searchQuery.set('');
  }
}
