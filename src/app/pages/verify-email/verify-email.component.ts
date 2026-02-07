import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AppButtonComponent } from '../../shared/components/app-button/app-button.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NotificationService } from '../../shared/services/notification.service';
import type { ApiResponse } from '../../core/models/api.model';
import { ROUTE_PATHS } from '../../core/constants/route.constants';
import { AuthApiService } from '../../features/auth/services/auth-api.service';

enum VerificationState {
  VERIFYING = 'verifying',
  SUCCESS = 'success',
  ERROR = 'error',
  EXPIRED = 'expired',
  RESENDING = 'resending',
  RESENT = 'resent', // After successful resend
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

  // Expose enum to template
  readonly VerificationState = VerificationState;

  state = signal<VerificationState>(VerificationState.VERIFYING);
  errorMessage = signal<string>('');

  private readonly redirectDelayMs = 3000;
  private email = '';
  private token = '';

  constructor() {
    this.initializeVerification();
  }

  private initializeVerification(): void {
    const queryParams = this.route.snapshot.queryParamMap;
    const email = queryParams.get('email');
    const token = queryParams.get('token');

    // Validate query params
    if (!email || !token) {
      this.handleMissingParams();
      return;
    }

    this.email = email;
    this.token = token;

    // Auto-verify on page load
    this.verifyEmail();
  }

  /**
   * Handle missing email or token in query params
   */
  private handleMissingParams(): void {
    this.state.set(VerificationState.ERROR);
    const message = this.translate.instant(
      'PAGES.VERIFY_EMAIL.ERRORS.MISSING_PARAMS',
    );
    this.errorMessage.set(message);
    this.notifications.showError(message);
  }

  /**
   * Call verify email API
   */
  private verifyEmail(): void {
    this.state.set(VerificationState.VERIFYING);

    this.authApi
      .verifyEmail(this.email, this.token)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: ApiResponse<null>) => {
          this.handleVerificationResponse(response);
        },

        error: () => {
          this.handleVerificationError();
        },
      });
  }

  private handleVerificationResponse(response: ApiResponse<null>): void {
    if (response?.success) {
      this.handleVerificationSuccess(response.message);
      return;
    }

    if (response?.statusCode === 400) {
      this.handleExpiredToken(response.message);
    } else {
      this.handleVerificationError(response?.message);
    }
  }

  /**
   * Handle successful verification
   */
  private handleVerificationSuccess(message?: string): void {
    const successMessage =
      message ?? this.translate.instant('PAGES.VERIFY_EMAIL.SUCCESS.MESSAGE');
    this.state.set(VerificationState.SUCCESS);
    this.notifications.showSuccess(successMessage);

    setTimeout(() => {
      void this.router.navigate([`/${ROUTE_PATHS.AUTH}/${ROUTE_PATHS.LOGIN}`]);
    }, this.redirectDelayMs);
  }

  /**
   * Handle expired token
   */
  private handleExpiredToken(message?: string): void {
    const errorMsg =
      message ?? this.translate.instant('PAGES.VERIFY_EMAIL.ERRORS.EXPIRED');
    this.state.set(VerificationState.EXPIRED);
    this.errorMessage.set(errorMsg);
    this.notifications.showError(errorMsg);
  }

  /**
   * Handle verification error
   */
  private handleVerificationError(message?: string): void {
    const errorMsg = message ?? this.translate.instant('ERRORS.SERVER.UNKNOWN');
    this.state.set(VerificationState.ERROR);
    this.errorMessage.set(errorMsg);
    this.notifications.showError(errorMsg);
  }

  /**
   * Resend verification email (public method called from template)
   */
  resendEmail(): void {
    if (!this.email) {
      return;
    }

    this.state.set(VerificationState.RESENDING);

    this.authApi
      .resendVerification(this.email)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: ApiResponse<null>) => {
          this.handleResendResponse(response);
        },
        error: () => {
          this.handleResendError();
        },
      });
  }

  /**
   * Handle resend verification response
   */
  private handleResendResponse(response: ApiResponse<null>): void {
    if (response?.success) {
      this.handleResendSuccess(response.message);
    } else {
      this.handleResendError(response?.message);
    }
  }

  /**
   * Handle successful resend
   */
  private handleResendSuccess(message?: string): void {
    const successMsg =
      message ?? this.translate.instant('PAGES.VERIFY_EMAIL.RESEND.SUCCESS');
    const checkInboxMsg = this.translate.instant(
      'PAGES.VERIFY_EMAIL.RESEND.CHECK_INBOX',
    );
    this.state.set(VerificationState.RESENT);
    this.errorMessage.set(checkInboxMsg);
    this.notifications.showSuccess(successMsg);
  }

  /**
   * Handle resend error
   */
  private handleResendError(message?: string): void {
    const errorMsg = message ?? this.translate.instant('ERRORS.SERVER.UNKNOWN');
    this.state.set(VerificationState.ERROR);
    this.errorMessage.set(errorMsg);
    this.notifications.showError(errorMsg);
  }
}
