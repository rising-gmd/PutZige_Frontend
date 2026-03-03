import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { DsSearchInputComponent } from '../../../design-system/composites/search-input/ds-search-input.component';
import { DsEmptyStateComponent } from '../../../design-system/primitives/empty-state/ds-empty-state.component';
import {
  Subject,
  debounceTime,
  distinctUntilChanged,
  switchMap,
  of,
  catchError,
} from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { UserSearchItemComponent } from './user-search-item.component';
import { NewChatService } from '../services/new-chat.service';
import {
  UserSearchResult,
  SearchUsersData,
  RecentContactsData,
  SuggestedUsersData,
} from '../models/new-chat.models';
import { ChatActions } from '../../../store/chat/chat.actions';

@Component({
  selector: 'app-new-chat-modal',
  standalone: true,
  imports: [
    DialogModule,
    ButtonModule,
    DsSearchInputComponent,
    DsEmptyStateComponent,
    UserSearchItemComponent,
  ],
  templateUrl: './new-chat-modal.component.html',
  styleUrls: ['./new-chat-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewChatModalComponent implements OnInit {
  private readonly newChatService = inject(NewChatService);
  private readonly store = inject(Store);
  private readonly searchSubject$ = new Subject<string>();

  readonly userSelected = output<UserSearchResult>();
  readonly closed = output<void>();

  visible = false;
  searchQuery = '';

  readonly isLoading = signal(false);
  readonly searchResults = signal<UserSearchResult[]>([]);
  readonly recentContacts = signal<UserSearchResult[]>([]);
  readonly suggestedUsers = signal<UserSearchResult[]>([]);

  constructor() {
    this.setupSearchDebounce();
  }

  ngOnInit(): void {
    this.loadInitialData();
  }

  private readonly searchInput =
    viewChild<DsSearchInputComponent>('searchInput');

  show(): void {
    this.visible = true;
    this.loadInitialData();
    // Focus the search input once the dialog animation completes (~50 ms is enough).
    setTimeout(() => this.searchInput()?.focus(), 50);
  }

  hide(): void {
    this.visible = false;
    this.resetState();
  }

  /**
   * Called by ds-search-input (valueChange) and (cleared).
   * Debounce is handled by the modal's own searchSubject$ pipeline;
   * ds-search-input is configured with [debounceMs]="0" so we don't double-debounce.
   */
  onSearchInput(query: string): void {
    this.searchQuery = query;
    this.searchSubject$.next(query);
  }

  onUserSelected(user: UserSearchResult): void {
    // Notify parent in case it needs to react (e.g. optimistic navigation).
    this.userSelected.emit(user);

    // Dispatch to the store — the startConversation$ effect handles fast-path
    // (conversation already exists) vs slow-path (create via API).
    // selectAfterCreate$ then selects the conversation automatically.
    this.store.dispatch(
      ChatActions.newConversationStarted({
        user: {
          id: user.id,
          username: user.username,
          email: user.email ?? '',
          displayName: user.displayName?.trim() || user.username,
          profilePictureUrl: user.profilePictureUrl,
          isOnline: user.isOnline ?? false,
        },
      }),
    );

    // Close immediately — the effect is non-blocking and the conversation
    // will appear in the list as soon as the API responds.
    this.hide();
  }

  onClose(): void {
    this.closed.emit();
    this.hide();
  }

  trackById(index: number, item: UserSearchResult) {
    return item.id;
  }

  private setupSearchDebounce(): void {
    this.searchSubject$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((query) => {
          if (query.trim().length === 0) {
            this.searchResults.set([]);
            return of(null);
          }

          this.isLoading.set(true);
          return this.newChatService.searchUsers({ query, pageSize: 20 }).pipe(
            catchError(() => {
              this.isLoading.set(false);
              return of(null);
            }),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((response: SearchUsersData | null) => {
        this.isLoading.set(false);
        if (response) {
          this.searchResults.set(response.users || []);
        }
      });
  }

  private loadInitialData(): void {
    // recent contacts
    this.newChatService
      .getRecentContacts()
      .subscribe((resp: RecentContactsData) => {
        this.recentContacts.set(resp.contacts || []);
      });

    // suggestions
    this.newChatService
      .getSuggestedUsers()
      .subscribe((resp: SuggestedUsersData) => {
        this.suggestedUsers.set(resp.suggestions || []);
      });
  }

  private resetState(): void {
    this.searchQuery = '';
    this.searchResults.set([]);
    this.isLoading.set(false);
  }
}
