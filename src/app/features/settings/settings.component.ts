import {
  Component,
  ChangeDetectionStrategy,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { take } from 'rxjs/operators';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth/auth.service';
import { UI_CONSTANTS } from '../../core/constants/ui.constants';
import { NotificationService } from '../../shared/services/notification.service';
import { LocalStorageService } from '../../core/services/local-storage.service';
import { STORAGE_KEYS } from '../../core/constants/storage-keys.constants';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SelectModule,
    ToggleSwitchModule,
    TranslateModule,
  ],
  templateUrl: './settings.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsComponent {
  private readonly userService = inject(UserService);
  private readonly auth = inject(AuthService);
  // TimezoneService not required directly in this component; timezone
  // is managed via UserService and AuthService. Keep code minimal.
  private readonly notificationService = inject(NotificationService);
  private readonly localStorage = inject(LocalStorageService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly translate = inject(TranslateService);

  readonly isLoading = signal(false);
  readonly isSaving = signal(false);
  readonly selectedTimezone = signal<string>(
    UI_CONSTANTS.DEFAULT_TIMEZONE as string,
  );
  private previousTimezone = UI_CONSTANTS.DEFAULT_TIMEZONE as string;

  readonly options = UI_CONSTANTS.SUPPORTED_TIMEZONES;

  private readonly htmlEl = document.documentElement;
  readonly isDarkMode = signal<boolean>(
    this.htmlEl.classList.contains('my-app-dark'),
  );

  private applySavedTheme(): void {
    const saved = this.localStorage.get<string | null>(
      STORAGE_KEYS.THEME,
      null,
    );
    if (saved === 'dark') {
      this.htmlEl.classList.add('my-app-dark');
      this.isDarkMode.set(true);
    } else {
      this.htmlEl.classList.remove('my-app-dark');
      this.isDarkMode.set(false);
    }
  }

  constructor() {
    // load preferences
    this.isLoading.set(true);
    this.userService
      .getUserPreferences()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
          const tz = response?.timeZoneId || browserTz;
          this.selectedTimezone.set(tz);
          this.previousTimezone = this.selectedTimezone();
          this.isLoading.set(false);
          // Apply saved UI theme after preferences load completes
          this.applySavedTheme();
        },
        error: () => {
          // Notify user, fall back to browser timezone
          this.notificationService.showWarn(
            this.translate.instant('settings.load_error'),
          );
          this.selectedTimezone.set(
            Intl.DateTimeFormat().resolvedOptions().timeZone,
          );
          this.isLoading.set(false);
          // Apply saved UI theme even when loading preferences fails
          this.applySavedTheme();
        },
      });
  }

  onTimezoneChange(value: string | null | undefined): void {
    if (!value) return;
    if (value === this.selectedTimezone()) return;
    if (this.isSaving()) return;

    this.previousTimezone = this.selectedTimezone();
    this.selectedTimezone.set(value);
    this.isSaving.set(true);
    // Notifications will convey errors/success to the user

    this.userService
      .updateUserPreferences({ timeZoneId: value })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          // show success toast, refresh auth, then stop saving indicator
          this.notificationService.showSuccess(
            this.translate.instant('settings.timezone_saved'),
          );
          this.auth
            .checkAuthStatus()
            .pipe(take(1), takeUntilDestroyed(this.destroyRef))
            .subscribe({
              next: () => {
                /* no-op; user refreshed */
              },
              error: () => {
                /* ignore auth refresh errors */
              },
              complete: () => {
                // ensure saving indicator always cleared
                this.isSaving.set(false);
              },
            });
        },
        error: () => {
          this.notificationService.showError(
            this.translate.instant('settings.save_error'),
          );
          this.selectedTimezone.set(this.previousTimezone);
          this.isSaving.set(false);
        },
      });
  }

  toggleDarkMode(): void {
    this.htmlEl.classList.toggle('my-app-dark');
    const isDark = this.htmlEl.classList.contains('my-app-dark');
    this.isDarkMode.set(isDark);
    try {
      this.localStorage.set(STORAGE_KEYS.THEME, isDark ? 'dark' : 'light');
    } catch {
      // ignore storage errors silently
    }
  }
}
