import {
  Component,
  ChangeDetectionStrategy,
  signal,
  inject,
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
import { AppInputComponent } from '../../shared/components/app-input/app-input.component';
import { AppPasswordComponent } from '../../shared/components/app-password/app-password.component';
import { AppButtonComponent } from '../../shared/components/app-button/app-button.component';
import { RegisterService } from './register.service';
import { firstValueFrom } from 'rxjs';
import { AbstractControl } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';

function usernameValidator() {
  return Validators.pattern(/^[A-Za-z0-9_]{3,50}$/);
}

function passwordPattern() {
  // At least 8 chars, uppercase, lowercase, digit, special
  return Validators.pattern(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/,
  );
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
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
      validators: [Validators.required, usernameValidator()],
    }),
    password: new FormControl<string>('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(8),
        passwordPattern(),
      ],
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

  async onSubmit(): Promise<void> {
    this.submitted.set(true);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    try {
      const payload = this.form.getRawValue();
      await firstValueFrom(this.service.register(payload));
      // TODO: navigate to sign-in or show success (left minimal intentionally)
    } finally {
      this.loading.set(false);
    }
  }

  errorMessage(
    control: AbstractControl | null,
    labelKey?: string,
  ): string | null {
    if (!control || !control.errors) return null;
    const errs = control.errors;

    // Resolve label for messages (labelKey is translation key like 'common.labels.password')
    const label = labelKey
      ? this.translate.instant(labelKey)
      : this.translate.instant('common.labels.field');

    // Password-specific messages (use i18n keys)
    if (control === this.password) {
      if (errs['required'])
        return this.translate.instant('errors.validation.password.required');
      if (errs['minlength'])
        return this.translate.instant('errors.validation.password.minLength', {
          count: errs['minlength'].requiredLength,
        });
      if (errs['pattern'])
        return this.translate.instant('errors.validation.password.pattern');
      return this.translate.instant('errors.validation.password.invalid');
    }

    // Generic messages
    if (errs['required'])
      return this.translate.instant('errors.validation.required');
    if (errs['email']) return this.translate.instant('errors.validation.email');
    if (errs['maxlength'])
      return this.translate.instant('errors.validation.maxLength', {
        count: errs['maxlength'].requiredLength,
      });
    if (errs['minlength'])
      return this.translate.instant('errors.validation.minLength', {
        count: errs['minlength'].requiredLength,
      });
    if (errs['pattern']) {
      const value = control.value || '';
      if (/^[A-Za-z0-9_]*$/.test(value)) {
        return this.translate.instant('errors.validation.username.pattern');
      }
      return this.translate.instant('errors.validation.password.pattern');
    }
    return (
      this.translate.instant('errors.validation.invalid') ||
      `${label} is invalid.`
    );
  }
}
