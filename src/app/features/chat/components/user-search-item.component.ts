import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { UserSearchResult } from '../models/new-chat.models';
import { DsAvatarComponent } from '../../../design-system/primitives/avatar/ds-avatar.component';

@Component({
  selector: 'app-user-search-item',
  standalone: true,
  imports: [DsAvatarComponent],
  templateUrl: './user-search-item.component.html',
  styleUrls: ['./user-search-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserSearchItemComponent {
  readonly user = input.required<UserSearchResult>();
  readonly selected = output<UserSearchResult>();

  /** Used for aria-label only — ds-avatar derives its own display label. */
  readonly displayName = computed(
    () => this.user().displayName?.trim() || this.user().username || '',
  );

  onSelect(): void {
    this.selected.emit(this.user());
  }
}
