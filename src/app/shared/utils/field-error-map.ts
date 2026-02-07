import { AbstractControl } from '@angular/forms';

export interface ErrorDescriptor {
  key: string;
  params?: Record<string, unknown>;
}

export type FieldName = 'username' | 'email' | 'password' | 'terms' | 'generic';

export function getFieldErrorDescriptor(
  control: AbstractControl | null,
  label: string,
  field: FieldName = 'generic',
): ErrorDescriptor | null {
  if (!control || !control.errors) return null;
  const errs = control.errors as Record<string, unknown>;
  const has = (k: string) => Boolean(errs[k]);
  const getErr = <T = unknown>(k: string) => errs[k] as T | undefined;

  // Field-specific mappings
  if (field === 'username') {
    if (has('required'))
      return {
        key: 'ERRORS.VALIDATION.REQUIRED_FIELD',
        params: { field: label },
      };
    const max = getErr<{ requiredLength?: number }>('maxlength');
    if (max)
      return {
        key: 'ERRORS.VALIDATION.MAX_LENGTH',
        params: { count: max.requiredLength },
      };
    const min = getErr<{ requiredLength?: number }>('minlength');
    if (min)
      return {
        key: 'ERRORS.VALIDATION.MIN_LENGTH',
        params: { count: min.requiredLength },
      };
    if (has('pattern')) {
      const value = (control && (control.value as string)) || '';
      const len = value.length;
      if (len > 0 && len < 3)
        return { key: 'ERRORS.VALIDATION.MIN_LENGTH', params: { count: 3 } };
      if (len > 50)
        return { key: 'ERRORS.VALIDATION.MAX_LENGTH', params: { count: 50 } };
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

  if (field === 'email') {
    if (has('required'))
      return {
        key: 'ERRORS.VALIDATION.REQUIRED_FIELD',
        params: { field: label },
      };
    if (has('email')) return { key: 'ERRORS.VALIDATION.EMAIL' };
    const max = getErr<{ requiredLength?: number }>('maxlength');
    if (max)
      return {
        key: 'ERRORS.VALIDATION.MAX_LENGTH',
        params: { count: max.requiredLength },
      };
    return { key: 'ERRORS.VALIDATION.INVALID' };
  }

  if (field === 'password') {
    if (has('required'))
      return {
        key: 'ERRORS.VALIDATION.REQUIRED_FIELD',
        params: { field: label },
      };
    const min = getErr<{ requiredLength?: number }>('minlength');
    if (min)
      return {
        key: 'ERRORS.VALIDATION.PASSWORD.MIN_LENGTH',
        params: { count: min.requiredLength },
      };
    if (has('pattern')) return { key: 'ERRORS.VALIDATION.PASSWORD.PATTERN' };
    return { key: 'ERRORS.VALIDATION.PASSWORD.INVALID' };
  }

  if (field === 'terms') {
    return { key: 'ERRORS.VALIDATION.TERMS.REQUIRED' };
  }

  // Generic fallback mapping
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
  if (has('pattern')) return { key: 'ERRORS.VALIDATION.INVALID' };

  return { key: 'ERRORS.VALIDATION.INVALID' };
}
