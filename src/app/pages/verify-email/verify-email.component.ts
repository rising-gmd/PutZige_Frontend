import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ROUTE_PATHS } from '../../core/constants/route.constants';
import type { ApiResponse } from '../../core/models/api.model';
import { AuthApiService } from '../../features/auth/services/auth-api.service';
import { AppButtonComponent } from '../../shared/components/app-button/app-button.component';
import { NotificationService } from '../../shared/services/notification.service';
import { HttpErrorResponse } from '@angular/common/http';
import { mapResponseCode } from '../../core/i18n/response-code-map';

enum VerificationState {
  VERIFYING = 'verifying',
  SUCCESS = 'success',
  ERROR = 'error',
  RESENDING = 'resending',
  RESENT = 'resent',
}

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule, AppButtonComponent],
  templateUrl: './verify-email.component.html',
  styleUrls: ['./verify-email.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VerifyEmailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly authApi = inject(AuthApiService);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);
  private readonly notifications = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly VerificationState = VerificationState;

  state = signal<VerificationState>(VerificationState.VERIFYING);
  message = signal<string>('');

  private readonly redirectDelayMs = 3000;
  private token = '';

  constructor() {
    this.initializeVerification();
  }

  private initializeVerification(): void {
    const params = this.route.snapshot.queryParamMap;
    this.token = params.get('token') || '';

    if (!this.token) {
      this.state.set(VerificationState.ERROR);
      const msg = this.translate.instant('auth.verify_email_missing_token');
      this.message.set(msg);
      this.notifications.showError(msg);
      return;
    }

    this.verifyEmail();
  }

  private verifyEmail(): void {
    this.state.set(VerificationState.VERIFYING);

    this.authApi
      .verifyEmail(this.token)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => this.handleVerificationResponse(response),
        error: (error) => this.handleVerificationError(error),
      });
  }

  private handleVerificationResponse(response: ApiResponse<null>): void {
    const code = response.responseCode;
    const key = mapResponseCode(code);
    const msg = this.translate.instant(key);

    if (response.success) {
      this.state.set(VerificationState.SUCCESS);
      this.message.set(msg);
      this.notifications.showSuccess(msg);
      setTimeout(
        () =>
          this.router.navigate([`/${ROUTE_PATHS.AUTH}/${ROUTE_PATHS.LOGIN}`]),
        this.redirectDelayMs,
      );
    } else {
      this.state.set(VerificationState.ERROR);
      this.message.set(msg);
      this.notifications.showError(msg);
    }
  }

  private handleVerificationError(error: HttpErrorResponse): void {
    const responseCode = error?.error?.responseCode;

    if (responseCode) {
      const key = mapResponseCode(responseCode);
      const msg = this.translate.instant(key);
      this.state.set(VerificationState.ERROR);
      this.message.set(msg);
      this.notifications.showError(msg);
    } else {
      this.state.set(VerificationState.ERROR);
    }
  }

  resendEmail(): void {
    if (!this.token) return;

    this.state.set(VerificationState.RESENDING);

    this.authApi
      .resendVerification(this.token)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => this.handleResendResponse(response),
        error: (error) => this.handleResendError(error),
      });
  }

  private handleResendResponse(response: ApiResponse<null>): void {
    const code = response.responseCode;
    const key = mapResponseCode(code);
    const msg = this.translate.instant(key);

    if (response.success) {
      this.state.set(VerificationState.RESENT);
      this.message.set(msg);
      this.notifications.showSuccess(msg);
    } else {
      this.state.set(VerificationState.ERROR);
      this.message.set(msg);
      this.notifications.showError(msg);
    }
  }

  private handleResendError(error: HttpErrorResponse): void {
    const responseCode = error?.error?.responseCode;

    if (responseCode) {
      const key = mapResponseCode(responseCode);
      const msg = this.translate.instant(key);
      this.state.set(VerificationState.ERROR);
      this.message.set(msg);
      this.notifications.showError(msg);
    } else {
      this.state.set(VerificationState.ERROR);
    }
  }
}
