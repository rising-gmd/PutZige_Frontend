import { AbstractControl } from '@angular/forms';

export type FieldKind = 'generic' | 'password' | 'terms' | 'username';

export interface ErrorDescriptor {
  key: string;
  params?: Record<string, unknown>;
}

export function getFormError(
  control: AbstractControl | null,
  label: string,
  kind: FieldKind = 'generic',
): ErrorDescriptor | null {
  if (!control || !control.errors) return null;
  const errs = control.errors as Record<string, unknown>;
  const has = (k: string) => Boolean(errs[k]);
  const getErr = <T = unknown>(k: string) => errs[k] as T | undefined;

  if (kind === 'password') {
    if (has('required'))
      return {
        key: 'ERRORS.VALIDATION.REQUIRED_FIELD',
        params: { field: label },
      };
    const minErr = getErr<{ requiredLength?: number }>('minlength');
    if (minErr)
      return {
        key: 'ERRORS.VALIDATION.PASSWORD.MIN_LENGTH',
        params: { count: minErr.requiredLength },
      };
    if (has('pattern')) return { key: 'ERRORS.VALIDATION.PASSWORD.PATTERN' };
    return { key: 'ERRORS.VALIDATION.PASSWORD.INVALID' };
  }

  if (kind === 'terms') {
    return { key: 'ERRORS.VALIDATION.TERMS.REQUIRED' };
  }

  if (kind === 'username') {
    if (has('required'))
      return {
        key: 'ERRORS.VALIDATION.REQUIRED_FIELD',
        params: { field: label },
      };
    const maxErrU = getErr<{ requiredLength?: number }>('maxlength');
    if (maxErrU)
      return {
        key: 'ERRORS.VALIDATION.MAX_LENGTH',
        params: { count: maxErrU.requiredLength },
      };
    // username validator uses pattern that encodes length; provide more detailed feedback
    if (has('pattern')) {
      const value = (control && (control.value as string)) || '';
      const len = value.length;
      // explicit length hints when pattern failed due to length
      if (len > 0 && len < 3)
        return { key: 'ERRORS.VALIDATION.MIN_LENGTH', params: { count: 3 } };
      if (len > 50)
        return { key: 'ERRORS.VALIDATION.MAX_LENGTH', params: { count: 50 } };
      // otherwise report which characters are invalid
      const invalid = value.match(/[^A-Za-z0-9_]/g) || [];
      const unique = Array.from(new Set(invalid));
      const chars = unique.join(', ');
      return {
        key: 'ERRORS.VALIDATION.USERNAME.INVALID_CHARS',
        params: { chars },
      };
    }
    return { key: 'ERRORS.VALIDATION.INVALID' };
  }

  // Generic messages
  if (has('required'))
    return {
      key: 'ERRORS.VALIDATION.REQUIRED_FIELD',
      params: { field: label },
    };
  if (has('email')) return { key: 'ERRORS.VALIDATION.EMAIL' };
  const maxErr = getErr<{ requiredLength?: number }>('maxlength');
  if (maxErr)
    return {
      key: 'ERRORS.VALIDATION.MAX_LENGTH',
      params: { count: maxErr.requiredLength },
    };
  const minErr = getErr<{ requiredLength?: number }>('minlength');
  if (minErr)
    return {
      key: 'ERRORS.VALIDATION.MIN_LENGTH',
      params: { count: minErr.requiredLength },
    };
  if (has('pattern')) {
    const value = control.value || '';
    if (/^[A-Za-z0-9_]*$/.test(value))
      return { key: 'ERRORS.VALIDATION.USERNAME.PATTERN' };
    return { key: 'ERRORS.VALIDATION.PASSWORD.PATTERN' };
  }

  return { key: 'ERRORS.VALIDATION.INVALID' };
}
