import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserSearchResult } from '../models/new-chat.models';

@Component({
  selector: 'app-user-search-item',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-search-item.component.html',
  styleUrls: ['./user-search-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserSearchItemComponent {
  @Input({ required: true }) user!: UserSearchResult;
  @Output() selected = new EventEmitter<UserSearchResult>();

  get displayName(): string {
    return this.user.displayName?.trim() || this.user.username || '';
  }

  get avatarText(): string {
    return this.displayName
      .split(/\s+/)
      .map((w) => w.charAt(0))
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  onSelect(): void {
    this.selected.emit(this.user);
  }
}
