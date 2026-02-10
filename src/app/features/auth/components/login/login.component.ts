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
import { AuthService } from '../../../../core/services/auth/auth.service';
import type { LoginRequest } from '../../../../core/models/auth.model';
import {
  FieldKind,
  getFormError,
} from '../../../../shared/utils/form-error.util';
import { getFieldErrorDescriptor } from '../../../../shared/utils/field-error-map';
import { finalize } from 'rxjs/operators';
import { NotificationService } from '../../../../shared/services/notification.service';
import { AbstractControl } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

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
  private readonly authService = inject(AuthService);
  private readonly translate = inject(TranslateService);
  private readonly notifications = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  loading = signal(false);
  submitted = signal(false);

  private returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/chat';

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
    const credentials: LoginRequest = {
      identifier: raw.identifier,
      password: raw.password,
    };

    this.authService
      .login(credentials)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: () => this.handleLoginSuccess(),
        error: (err: Error) => this.handleLoginError(err),
      });
  }

  private handleLoginSuccess(): void {
    const msg = this.translate.instant('auth.login_success');
    this.notifications.showSuccess(msg);
    this.router.navigateByUrl(this.returnUrl);
  }

  private handleLoginError(error: Error): void {
    const msg = error.message || this.translate.instant('auth.login_failed');
    this.notifications.showError(msg);
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
      : this.translate.instant('form.required_field');
  }

  private getField(control: AbstractControl | null): FieldKind {
    if (control === this.password) return 'password';
    if (control === this.identifier) return 'username';
    return 'generic';
  }
}
