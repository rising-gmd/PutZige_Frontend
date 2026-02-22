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
import { MessageModule } from 'primeng/message';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth/auth.service';
import { TimezoneService } from '../../core/services/timezone.service';
import { UI_CONSTANTS } from '../../core/constants/ui.constants';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SelectModule,
    MessageModule,
    TranslateModule,
  ],
  templateUrl: './settings.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsComponent {
  private readonly userService = inject(UserService);
  private readonly auth = inject(AuthService);
  private readonly tz = inject(TimezoneService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly translate = inject(TranslateService);

  readonly isLoading = signal(false);
  readonly isSaving = signal(false);
  readonly hasError = signal(false);
  readonly errorMessage = signal<string | null>(null);
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
          this.isLoading.set(false);
        },
        error: () => {
          this.hasError.set(true);
          this.errorMessage.set(this.translate.instant('settings.load_error'));
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
    this.hasError.set(false);

    this.userService
      .updateUserPreferences({ timeZoneId: value })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isSaving.set(false);
          // refresh auth user to pick up changed settings
          this.auth
            .checkAuthStatus()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe();
        },
        error: () => {
          this.selectedTimezone.set(this.previousTimezone);
          this.isSaving.set(false);
          this.hasError.set(true);
          this.errorMessage.set(this.translate.instant('settings.save_error'));
        },
      });
  }
}
