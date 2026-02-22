import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DrawerModule } from 'primeng/drawer';
import { SettingsComponent } from '../../../settings/settings.component';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-settings-drawer',
  standalone: true,
  imports: [CommonModule, DrawerModule, SettingsComponent, TranslateModule],
  templateUrl: './settings-drawer.component.html',
  styleUrls: ['./settings-drawer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsDrawerComponent {
  readonly isVisible = signal(false);

  open(): void {
    this.isVisible.set(true);
  }

  close(): void {
    this.isVisible.set(false);
  }
}
