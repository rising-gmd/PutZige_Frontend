import { ValidatorFn, Validators } from '@angular/forms';

// Username: letters, numbers, underscore, length 3-50
export const usernameValidator: ValidatorFn =
  Validators.pattern(/^[A-Za-z0-9_]{3,50}$/);

// Password: at least 8 chars, one lower, one upper, one digit, one special
export const passwordPattern: ValidatorFn = Validators.pattern(
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/,
);
