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

  errorMessage(control: AbstractControl | null, label?: string): string | null {
    const field = label ? `${label}` : 'This field';
    if (!control || !control.errors) return null;
    const errs = control.errors;
    if (errs['required']) return `${field} is required.`;
    if (errs['email']) return 'Please enter a valid email address.';
    if (errs['maxlength'])
      return `${field} must be at most ${errs['maxlength'].requiredLength} characters.`;
    if (errs['minlength'])
      return `${field} must be at least ${errs['minlength'].requiredLength} characters.`;
    if (errs['pattern']) {
      const value = control.value || '';
      if (/^[A-Za-z0-9_]*$/.test(value)) {
        return `${field} must be 3–50 characters and may contain letters, numbers and underscore.`;
      }
      return `${field} must contain uppercase, lowercase, a number, and a special character.`;
    }
    return `${field} is invalid.`;
  }
}
