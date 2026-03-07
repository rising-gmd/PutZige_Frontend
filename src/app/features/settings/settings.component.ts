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
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { take } from 'rxjs/operators';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth/auth.service';
import { UI_CONSTANTS } from '../../core/constants/ui.constants';
import { NotificationService } from '../../shared/services/notification.service';
import { DsThemeSelectorComponent } from '../../design-system/composites/theme-selector/ds-theme-selector.component';
import {
  ThemeService,
  ColorThemeName,
} from '../../core/services/theme.service';
import { DarkModeService } from '../../theme/dark-mode.service';
import { STORAGE_KEYS } from '../../core/constants/storage-keys.constants';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SelectModule,
    TranslateModule,
    DsThemeSelectorComponent,
  ],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsComponent {
  private readonly userService = inject(UserService);
  private readonly auth = inject(AuthService);
  private readonly notificationService = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly translate = inject(TranslateService);
  private readonly themeService = inject(ThemeService);
  private readonly darkModeService = inject(DarkModeService);

  readonly isLoading = signal(false);
  readonly isSaving = signal(false);
  readonly selectedTimezone = signal<string>(
    UI_CONSTANTS.DEFAULT_TIMEZONE as string,
  );
  private previousTimezone = UI_CONSTANTS.DEFAULT_TIMEZONE as string;

  readonly options = UI_CONSTANTS.SUPPORTED_TIMEZONES;

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

          // Apply backend-persisted theme preferences so they override
          // the localStorage cache if the user changed settings on another device.
          if (response?.theme) {
            const themeName = response.theme as ColorThemeName;
            if (themeName !== this.themeService.activeThemeName()) {
              this.themeService.applyTheme(themeName, false);
            }
          }
          if (
            response?.isDarkMode !== undefined &&
            response?.isDarkMode !== null
          ) {
            const current = this.darkModeService.isDark();
            if (response.isDarkMode !== current) {
              this.darkModeService.set(response.isDarkMode);
              localStorage.setItem(
                STORAGE_KEYS.DARK_MODE,
                String(response.isDarkMode),
              );
            }
          }

          this.isLoading.set(false);
        },
        error: () => {
          this.notificationService.showWarn(
            this.translate.instant('settings.load_error'),
          );
          this.selectedTimezone.set(
            Intl.DateTimeFormat().resolvedOptions().timeZone,
          );
          this.isLoading.set(false);
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
}
