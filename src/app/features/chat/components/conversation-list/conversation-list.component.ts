import {
  Component,
  inject,
  ChangeDetectionStrategy,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { ConversationItemComponent } from '../conversation-item/conversation-item.component';
import { ChatStateService } from '../../services/chat-state.service';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-conversation-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    InputTextModule,
    ButtonModule,
    ConversationItemComponent,
  ],
  templateUrl: './conversation-list.component.html',
  styleUrls: ['./conversation-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConversationListComponent {
  private readonly chatState = inject(ChatStateService);

  readonly conversations = this.chatState.sortedConversations;
  readonly activeConversationId = this.chatState.activeConversationId;
  readonly isLoading = this.chatState.isLoadingConversations;
  readonly searchQuery = signal('');
  readonly searchResults = this.chatState.searchResults;

  trackByConversation(index: number, item: { id: string }) {
    return item.id;
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
