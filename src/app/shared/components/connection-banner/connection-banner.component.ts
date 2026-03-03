import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NgClass } from '@angular/common';
import { Store } from '@ngrx/store';
import { TranslatePipe } from '@ngx-translate/core';
import {
  selectConnectionStatus,
  selectShowConnectionBanner,
} from '../../../store/connection/connection.selectors';

/**
 * Sticky notification strip shown whenever the SignalR hub is not fully
 * connected.  Uses `aria-live="polite"` so screen-readers announce state
 * changes without interrupting the user, and `aria-atomic="true"` so the
 * whole message is re-read on every update.
 *
 * Placement: insert `<app-connection-banner />` once in the layout template,
 * directly below the header.  The component itself handles its own visibility
 * so callers need no `*ngIf` wrapper.
 */
@Component({
  selector: 'app-connection-banner',
  standalone: true,
  imports: [NgClass, TranslatePipe],
  templateUrl: './connection-banner.component.html',
  styleUrls: ['./connection-banner.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConnectionBannerComponent {
  private readonly store = inject(Store);

  /** Derived selector — `true` while status !== 'connected'. */
  protected readonly showBanner = this.store.selectSignal(
    selectShowConnectionBanner,
  );

  /** Full status string for conditional CSS classes. */
  protected readonly status = this.store.selectSignal(selectConnectionStatus);
}
