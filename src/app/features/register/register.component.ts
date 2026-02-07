import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  Component,
  ChangeDetectionStrategy,
  signal,
  inject,
  DestroyRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MessageModule } from 'primeng/message';
import { AppInputComponent } from '../../shared/components/app-input/app-input.component';
import { AppPasswordComponent } from '../../shared/components/app-password/app-password.component';
import { AppButtonComponent } from '../../shared/components/app-button/app-button.component';
import { RegisterService } from './register.service';
import type { RegisterResponse } from './register.service';
import type { ApiResponse } from '../../core/models/api.model';
import {
  usernameValidator,
  passwordPattern,
} from '../../shared/validators/auth.validators';
import { FieldKind, getFormError } from '../../shared/utils/form-error.util';
import { getFieldErrorDescriptor } from '../../shared/utils/field-error-map';
import { finalize } from 'rxjs/operators';
import { ROUTE_PATHS } from '../../core/constants/route.constants';
import { NotificationService } from '../../shared/services/notification.service';
import { Router } from '@angular/router';
import { AbstractControl } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-register',
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
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterComponent {
  private readonly service = inject(RegisterService);
  private readonly translate = inject(TranslateService);
  private readonly notifications = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  loading = signal(false);
  submitted = signal(false);

  readonly form = new FormGroup({
    email: new FormControl<string>('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.email,
        Validators.maxLength(255),
      ],
    }),
    username: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, usernameValidator],
    }),
    password: new FormControl<string>('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(8),
        passwordPattern,
      ],
    }),
    terms: new FormControl<boolean>(false, {
      nonNullable: true,
      validators: [Validators.requiredTrue],
    }),
  });

  get email() {
    return this.form.controls.email;
  }
  get username() {
    return this.form.controls.username;
  }
  get password() {
    return this.form.controls.password;
  }
  get terms() {
    return this.form.controls.terms;
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
      email: raw.email,
      username: raw.username,
      password: raw.password,
      displayName: '',
    } as const;

    this.service
      .register(payload)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: (res: ApiResponse<RegisterResponse>) => {
          if (res && res.success) {
            const code = res?.responseCode;
            const msg = code
              ? this.translate.instant(
                  `RESPONSES.CODES.${code}`,
                  res?.metadata as Record<string, unknown> | undefined,
                )
              : this.translate.instant('MESSAGES.REGISTRATION_SUCCESS');
            this.notifications.showSuccess(msg);
            this.router.navigateByUrl(
              `/${ROUTE_PATHS.AUTH}/${ROUTE_PATHS.LOGIN}`,
            );
            return;
          }

          // Non-success response from API: show error message if provided
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
    if (control === this.terms) return 'terms';
    if (control === this.username) return 'username';
    return 'generic';
  }
}
