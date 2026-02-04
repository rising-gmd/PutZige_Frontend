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
import { AuthApiService } from '../../features/auth/services/auth-api.service';
import { NotificationService } from '../../shared/services/notification.service';
import type { ApiResponse } from '../../core/models/api.model';
import { ROUTE_PATHS } from '../../core/constants/route.constants';

type VerificationState =
  | 'verifying'
  | 'success'
  | 'error'
  | 'expired'
  | 'resending';

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

  state = signal<VerificationState>('verifying');
  errorMessage = signal<string | null>(null);
  private readonly redirectMs = 3000;
  private email = '';

  constructor() {
    this.startVerification();
  }

  private startVerification(): void {
    const qp = this.route.snapshot.queryParamMap;
    const email = qp.get('email');
    const token = qp.get('token');

    if (!email || !token) {
      this.state.set('error');
      const msg = this.translate.instant(
        'pages.verifyEmail.errors.missingParams',
      );
      this.errorMessage.set(msg);
      this.notifications.showError(msg);
      return;
    }

    this.email = email;

    this.state.set('verifying');

    this.authApi
      .verifyEmail(email, token)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: ApiResponse<null>) => {
          if (res && res.success) {
            const successMsg =
              res.message ??
              this.translate.instant('pages.verifyEmail.success.message');
            this.notifications.showSuccess(successMsg);
            this.state.set('success');
            setTimeout(() => {
              void this.router.navigate([
                `/${ROUTE_PATHS.AUTH}/${ROUTE_PATHS.LOGIN}`,
              ]);
            }, this.redirectMs);
            return;
          }

          // Non-success ApiResponse: surface message via NotificationService and show error UI
          this.state.set('error');
          const errMsg =
            res?.message ?? this.translate.instant('errors.server.unknown');
          this.errorMessage.set(errMsg);
          this.notifications.showError(errMsg);
          if (res?.statusCode === 400) {
            this.state.set('expired');
          }
        },
      });
  }

  resendEmail(): void {
    if (!this.email) return;
    this.state.set('resending');

    this.authApi
      .resendVerification(this.email)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: ApiResponse<null>) => {
          if (res && res.success) {
            this.state.set('error');
            const ok = this.translate.instant(
              'pages.verifyEmail.resend.checkInbox',
            );
            this.errorMessage.set(ok);
            this.notifications.showSuccess(
              res.message ??
                this.translate.instant('pages.verifyEmail.resend.success'),
            );
            return;
          }

          this.state.set('error');
          const err =
            res.message ?? this.translate.instant('errors.server.unknown');
          this.errorMessage.set(err);
          this.notifications.showError(err);
        },
      });
  }

  // Note: HTTP error handling is performed by the global interceptor; component only consumes ApiResponse
}
