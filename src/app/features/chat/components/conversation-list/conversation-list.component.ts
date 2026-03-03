import {
  Component,
  inject,
  ChangeDetectionStrategy,
  HostListener,
  signal,
  output,
  viewChild,
  viewChildren,
  ElementRef,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { Store } from '@ngrx/store';
import { ConversationItemComponent } from '../conversation-item/conversation-item.component';
import { NewChatModalComponent } from '../new-chat-modal.component';
import { chatFeature } from '../../../../store/chat/chat.reducer';
import { ChatActions } from '../../../../store/chat/chat.actions';
import { selectSortedConversations } from '../../../../store/chat/chat.selectors';
import { User } from '../../models/user.model';
import { UserSearchResult } from '../../models/new-chat.models';
import { NotificationService } from '../../../../shared/services/notification.service';
import { DsSearchInputComponent } from '../../../../design-system/composites/search-input/ds-search-input.component';
import { DsIconButtonComponent } from '../../../../design-system/composites/icon-button/ds-icon-button.component';
import { DsEmptyStateComponent } from '../../../../design-system/primitives/empty-state/ds-empty-state.component';
import { DsAvatarComponent } from '../../../../design-system/primitives/avatar/ds-avatar.component';

@Component({
  selector: 'app-conversation-list',
  standalone: true,
  imports: [
    ConversationItemComponent,
    NewChatModalComponent,
    ConfirmDialogModule,
    DsSearchInputComponent,
    DsIconButtonComponent,
    DsEmptyStateComponent,
    DsAvatarComponent,
  ],
  templateUrl: './conversation-list.component.html',
  styleUrls: ['./conversation-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  // ConfirmationService is scoped to this subtree so dialogs don't bleed
  // into unrelated parts of the app.
  providers: [ConfirmationService],
})
export class ConversationListComponent {
  // Component refs ──────────────────────────────────────────────────────────
  private readonly newChatModal =
    viewChild<NewChatModalComponent>('newChatModal');
  private readonly fabBtn = viewChild<DsIconButtonComponent>('fabBtn');
  /** Focused via Ctrl+K / Cmd+K keyboard shortcut. */
  private readonly searchInputRef =
    viewChild<DsSearchInputComponent>('searchInput');
  /** Used for keyboard navigation (ArrowDown / ArrowUp / Home / End). */
  protected readonly searchResultRefs =
    viewChildren<ElementRef<HTMLDivElement>>('searchResult');

  // Services ─────────────────────────────────────────────────────────────────
  private readonly store = inject(Store);
  private readonly notify = inject(NotificationService);
  private readonly confirmationService = inject(ConfirmationService);

  // ── State ───────────────────────────────────────────────────
  readonly conversations = toSignal(
    this.store.select(selectSortedConversations),
    { initialValue: [] },
  );
  readonly activeConversationId = toSignal(
    this.store.select(chatFeature.selectActiveConversationId),
    { initialValue: null },
  );
  readonly isLoading = toSignal(
    this.store
      .select(chatFeature.selectLoadingStatus)
      .pipe(map((status) => status === 'loading')),
    { initialValue: false },
  );
  readonly searchResults = toSignal(
    this.store.select(chatFeature.selectSearchResults),
    { initialValue: [] },
  );
  readonly searchQuery = signal('');

  // ── Outputs ────────────────────────────────────────────────────────────────
  /**
   * Emitted when the user picks "View profile" from a conversation context menu.
   * Payload is the `conversationId` so the parent can open the correct profile.
   */
  readonly profileRequested = output<string>();

  // ── New chat ───────────────────────────────────────────────────────────────

  showNewChatModal(): void {
    this.newChatModal()?.show();
  }

  /** Returns focus to the FAB so keyboard users don't lose their position. */
  onModalClosed(): void {
    this.fabBtn()?.focus();
  }

  // ── Search ─────────────────────────────────────────────────────────────────

  /**
   * Called by `ds-search-input` after its internal debounce.
   * Min-length guard prevents trivial server round trips (1-char queries
   * return too many results and cause flicker on slow connections).
   */
  onSearch(query: string): void {
    this.searchQuery.set(query);
    // Guard delegated to the searchUsers$ effect (debounceTime + length check).
    this.store.dispatch(ChatActions.searchQueryChanged({ query }));
  }

  onSelectConversation(conversationId: string): void {
    this.store.dispatch(ChatActions.conversationSelected({ conversationId }));
  }

  onSelectUser(user: User): void {
    // The startConversation$ effect handles fast-path (existing) vs slow-path (new) automatically.
    this.store.dispatch(ChatActions.newConversationStarted({ user }));
    this.searchQuery.set('');
  }

  onUserSelected(user: UserSearchResult): void {
    // Delegate to the same effect path — it will find the existing conversation or create one.
    this.store.dispatch(
      ChatActions.newConversationStarted({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          displayName: user.displayName?.trim() || user.username,
          profilePictureUrl: user.profilePictureUrl,
          isOnline: user.isOnline,
        },
      }),
    );
  }

  // ── Context menu handlers ──────────────────────────────────────────────────

  onViewProfile(conversationId: string): void {
    this.profileRequested.emit(conversationId);
  }

  onArchive(conversationId: string): void {
    // TODO: call chatState.archiveConversation(conversationId) — ref INC-XXXX
    this.notify.showInfo('Archive coming soon');
    console.debug('[ConversationList] archive requested for', conversationId);
  }

  onBlock(conversationId: string): void {
    // TODO: call chatState.blockUser(conversationId) — ref INC-XXXX
    this.notify.showInfo('Block coming soon');
    console.debug('[ConversationList] block requested for', conversationId);
  }

  onDelete(conversationId: string): void {
    this.confirmationService.confirm({
      message: 'Delete this conversation? This cannot be undone.',
      header: 'Delete Conversation',
      icon: 'pi pi-trash',
      acceptLabel: 'Delete',
      rejectLabel: 'Cancel',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        // TODO: call chatState.deleteConversation(conversationId) — ref INC-XXXX
        this.notify.showInfo('Delete coming soon');
        console.debug('[ConversationList] delete accepted for', conversationId);
      },
    });
  }

  // ── Global keyboard shortcuts ──────────────────────────────────────────────

  /**
   * Ctrl+K / Cmd+K focuses the search input — a widely adopted convention
   * (VS Code, GitHub, Linear) that power users expect.
   */
  @HostListener('document:keydown', ['$event'])
  onGlobalKeyDown(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
      event.preventDefault();
      this.searchInputRef()?.focus();
    }
  }

  // ── Arrow-key navigation for search results ────────────────────────────────

  /**
   * Standard ARIA Listbox keyboard pattern (APG 1.2 §Listbox).
   * Bound on each search-result `div` so focus management stays in the
   * element where the event originated.
   */
  onSearchResultKeyDown(event: KeyboardEvent, currentIndex: number): void {
    const items = this.searchResultRefs();
    if (!items.length) return;

    let nextIndex: number | null = null;
    switch (event.key) {
      case 'ArrowDown':
        nextIndex = Math.min(currentIndex + 1, items.length - 1);
        break;
      case 'ArrowUp':
        nextIndex = Math.max(currentIndex - 1, 0);
        break;
      case 'Home':
        nextIndex = 0;
        break;
      case 'End':
        nextIndex = items.length - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    items[nextIndex]?.nativeElement.focus();
  }
}
