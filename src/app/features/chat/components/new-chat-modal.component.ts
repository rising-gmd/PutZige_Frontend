import {
  Component,
  Output,
  EventEmitter,
  signal,
  inject,
  ChangeDetectionStrategy,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import {
  Subject,
  debounceTime,
  distinctUntilChanged,
  switchMap,
  of,
  catchError,
} from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { UserSearchItemComponent } from './user-search-item.component';
import { NewChatService } from '../services/new-chat.service';
import {
  UserSearchResult,
  SearchUsersData,
  RecentContactsData,
  SuggestedUsersData,
} from '../models/new-chat.models';
import { ElementRef, ViewChild } from '@angular/core';

@Component({
  selector: 'app-new-chat-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DialogModule,
    InputTextModule,
    ButtonModule,
    UserSearchItemComponent,
  ],
  templateUrl: './new-chat-modal.component.html',
  styleUrls: ['./new-chat-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewChatModalComponent implements OnInit {
  private readonly newChatService = inject(NewChatService);
  private readonly searchSubject$ = new Subject<string>();

  @Output() userSelected = new EventEmitter<UserSearchResult>();
  @Output() closed = new EventEmitter<void>();

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

  @ViewChild('searchInput', { read: ElementRef })
  private searchInput?: ElementRef<HTMLInputElement>;

  show(): void {
    this.visible = true;
    this.loadInitialData();
    // focus input after dialog opens
    setTimeout(() => this.searchInput?.nativeElement?.focus?.(), 50);
  }

  hide(): void {
    this.visible = false;
    this.resetState();
  }

  onSearchInput(event: Event): void {
    const query = (event.target as HTMLInputElement).value;
    this.searchQuery = query;
    this.searchSubject$.next(query);
  }

  onUserSelected(user: UserSearchResult): void {
    this.userSelected.emit(user);
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
