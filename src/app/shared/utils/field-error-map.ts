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
        key: 'errors.validation.requiredField',
        params: { field: label },
      };
    const max = getErr<{ requiredLength?: number }>('maxlength');
    if (max)
      return {
        key: 'errors.validation.maxLength',
        params: { count: max.requiredLength },
      };
    const min = getErr<{ requiredLength?: number }>('minlength');
    if (min)
      return {
        key: 'errors.validation.minLength',
        params: { count: min.requiredLength },
      };
    if (has('pattern')) {
      const value = (control && (control.value as string)) || '';
      const len = value.length;
      if (len > 0 && len < 3)
        return { key: 'errors.validation.minLength', params: { count: 3 } };
      if (len > 50)
        return { key: 'errors.validation.maxLength', params: { count: 50 } };
      const invalid = value.match(/[^A-Za-z0-9_]/g) || [];
      const unique = Array.from(new Set(invalid));
      const chars = unique.join(', ');
      return {
        key: 'errors.validation.username.invalidChars',
        params: { chars },
      };
    }
    return { key: 'errors.validation.invalid' };
  }

  if (field === 'email') {
    if (has('required'))
      return {
        key: 'errors.validation.requiredField',
        params: { field: label },
      };
    if (has('email')) return { key: 'errors.validation.email' };
    const max = getErr<{ requiredLength?: number }>('maxlength');
    if (max)
      return {
        key: 'errors.validation.maxLength',
        params: { count: max.requiredLength },
      };
    return { key: 'errors.validation.invalid' };
  }

  if (field === 'password') {
    if (has('required'))
      return {
        key: 'errors.validation.requiredField',
        params: { field: label },
      };
    const min = getErr<{ requiredLength?: number }>('minlength');
    if (min)
      return {
        key: 'errors.validation.password.minLength',
        params: { count: min.requiredLength },
      };
    if (has('pattern')) return { key: 'errors.validation.password.pattern' };
    return { key: 'errors.validation.password.invalid' };
  }

  if (field === 'terms') {
    return { key: 'errors.validation.terms.required' };
  }

  // Generic fallback mapping
  if (has('required'))
    return { key: 'errors.validation.requiredField', params: { field: label } };
  if (has('email')) return { key: 'errors.validation.email' };
  const maxErr = getErr<{ requiredLength?: number }>('maxlength');
  if (maxErr)
    return {
      key: 'errors.validation.maxLength',
      params: { count: maxErr.requiredLength },
    };
  const minErr = getErr<{ requiredLength?: number }>('minlength');
  if (minErr)
    return {
      key: 'errors.validation.minLength',
      params: { count: minErr.requiredLength },
    };
  if (has('pattern')) return { key: 'errors.validation.invalid' };

  return { key: 'errors.validation.invalid' };
}
