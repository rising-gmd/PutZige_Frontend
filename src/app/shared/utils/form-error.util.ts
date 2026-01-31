import { AbstractControl } from '@angular/forms';

export type FieldKind = 'generic' | 'password' | 'terms';

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
        key: 'errors.validation.requiredField',
        params: { field: label },
      };
    const minErr = getErr<{ requiredLength?: number }>('minlength');
    if (minErr)
      return {
        key: 'errors.validation.password.minLength',
        params: { count: minErr.requiredLength },
      };
    if (has('pattern')) return { key: 'errors.validation.password.pattern' };
    return { key: 'errors.validation.password.invalid' };
  }

  if (kind === 'terms') {
    return { key: 'errors.validation.terms.required' };
  }

  // Generic messages
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
  if (has('pattern')) {
    const value = control.value || '';
    if (/^[A-Za-z0-9_]*$/.test(value))
      return { key: 'errors.validation.username.pattern' };
    return { key: 'errors.validation.password.pattern' };
  }

  return { key: 'errors.validation.invalid' };
}
