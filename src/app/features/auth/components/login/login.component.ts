import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  Component,
  ChangeDetectionStrategy,
  signal,
  inject,
  DestroyRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  ReactiveFormsModule,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { MessageModule } from 'primeng/message';
import { AppInputComponent } from '../../../../shared/components/app-input/app-input.component';
import { AppPasswordComponent } from '../../../../shared/components/app-password/app-password.component';
import { AppButtonComponent } from '../../../../shared/components/app-button/app-button.component';
import { LoginService } from '../../services/login.service';
import type { LoginResponse } from '../../services/login.service';
import type { ApiResponse } from '../../../../core/models/api.model';
import {
  FieldKind,
  getFormError,
} from '../../../../shared/utils/form-error.util';
import { getFieldErrorDescriptor } from '../../../../shared/utils/field-error-map';
import { finalize } from 'rxjs/operators';
import { NotificationService } from '../../../../shared/services/notification.service';
import { AbstractControl } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MessageModule,
    TranslateModule,
    AppInputComponent,
    AppPasswordComponent,
    AppButtonComponent,
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  private readonly service = inject(LoginService);
  private readonly translate = inject(TranslateService);
  private readonly notifications = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  loading = signal(false);
  submitted = signal(false);

  readonly form = new FormGroup({
    identifier: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    password: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  get identifier() {
    return this.form.controls.identifier;
  }
  get password() {
    return this.form.controls.password;
  }

  async onSubmit(): Promise<void> {
    this.submitted.set(true);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const raw = this.form.getRawValue();
    const payload = {
      identifier: raw.identifier,
      password: raw.password,
    } as const;

    this.service
      .login(payload)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: (res: ApiResponse<LoginResponse>) => {
          if (res && res.success) {
            const code = res?.responseCode;
            const msg = code
              ? this.translate.instant(
                  `RESPONSES.CODES.${code}`,
                  res?.metadata as Record<string, unknown> | undefined,
                )
              : this.translate.instant('MESSAGES.LOGIN_SUCCESS');
            this.notifications.showSuccess(msg);
            // Navigate to chat on successful login
            this.router.navigateByUrl('/chat');
            return;
          }

          if (res && !res.success) {
            const code = res?.responseCode;
            const errMsg = code
              ? this.translate.instant(
                  `RESPONSES.CODES.${code}`,
                  res?.metadata as Record<string, unknown> | undefined,
                )
              : this.translate.instant('ERRORS.SERVER.UNKNOWN');
            this.notifications.showError(errMsg);
          }
        },
      });
  }

  errorMessage(
    control: AbstractControl | null,
    labelKey?: string,
  ): string | null {
    const label = this.getLabel(labelKey);
    const field: FieldKind = this.getField(control);
    const desc =
      getFieldErrorDescriptor(control, label, field) ??
      getFormError(control, label, field);
    if (!desc) return null;
    return this.translate.instant(desc.key, desc.params);
  }

  private getLabel(labelKey?: string): string {
    return labelKey
      ? this.translate.instant(labelKey)
      : this.translate.instant('COMMON.LABELS.FIELD');
  }

  private getField(control: AbstractControl | null): FieldKind {
    if (control === this.password) return 'password';
    if (control === this.identifier) return 'username';
    return 'generic';
  }
}
