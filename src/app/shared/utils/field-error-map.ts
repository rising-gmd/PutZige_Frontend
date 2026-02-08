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
        key: 'form.required_field',
        params: { field: label },
      };
    const max = getErr<{ requiredLength?: number }>('maxlength');
    if (max)
      return {
        key: 'form.max_length',
        params: { count: max.requiredLength },
      };
    const min = getErr<{ requiredLength?: number }>('minlength');
    if (min)
      return {
        key: 'form.min_length',
        params: { count: min.requiredLength },
      };
    if (has('pattern')) {
      const value = (control && (control.value as string)) || '';
      const len = value.length;
      if (len > 0 && len < 3)
        return { key: 'form.min_length', params: { count: 3 } };
      if (len > 50) return { key: 'form.max_length', params: { count: 50 } };
      const invalid = value.match(/[^A-Za-z0-9_]/g) || [];
      const unique = Array.from(new Set(invalid));
      const chars = unique.join(', ');
      return {
        key: 'form.username_invalid_chars',
        params: { chars },
      };
    }
    return { key: 'form.required' };
  }

  if (field === 'email') {
    if (has('required'))
      return {
        key: 'form.required_field',
        params: { field: label },
      };
    if (has('email')) return { key: 'form.email_invalid' };
    const max = getErr<{ requiredLength?: number }>('maxlength');
    if (max)
      return {
        key: 'form.max_length',
        params: { count: max.requiredLength },
      };
    return { key: 'form.required' };
  }

  if (field === 'password') {
    if (has('required'))
      return {
        key: 'form.required_field',
        params: { field: label },
      };
    const min = getErr<{ requiredLength?: number }>('minlength');
    if (min)
      return {
        key: 'form.password_min',
        params: { count: min.requiredLength },
      };
    if (has('pattern')) return { key: 'form.password_pattern' };
    return { key: 'form.password_invalid' };
  }

  if (field === 'terms') {
    return { key: 'form.terms_required' };
  }

  // Generic fallback mapping
  if (has('required'))
    return {
      key: 'form.required_field',
      params: { field: label },
    };
  if (has('email')) return { key: 'form.email_invalid' };
  const maxErr = getErr<{ requiredLength?: number }>('maxlength');
  if (maxErr)
    return {
      key: 'form.max_length',
      params: { count: maxErr.requiredLength },
    };
  const minErr = getErr<{ requiredLength?: number }>('minlength');
  if (minErr)
    return {
      key: 'form.min_length',
      params: { count: minErr.requiredLength },
    };
  if (has('pattern')) return { key: 'form.required' };

  return { key: 'form.required' };
}
