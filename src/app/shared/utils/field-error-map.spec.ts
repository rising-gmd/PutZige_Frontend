import { getFieldErrorDescriptor } from './field-error-map';
import { AbstractControl } from '@angular/forms';

describe('getFieldErrorDescriptor', () => {
  it('when control is null, then returns null', () => {
    const res = getFieldErrorDescriptor(null, 'Email');
    expect(res).toBeNull();
  });

  describe('username field', () => {
    it('when required error present, then returns requiredField descriptor', () => {
      const control = {
        errors: { required: true },
      } as unknown as AbstractControl;
      expect(getFieldErrorDescriptor(control, 'User', 'username')).toEqual({
        key: 'errors.validation.requiredField',
        params: { field: 'User' },
      });
    });

    it('when maxlength present, then returns maxLength descriptor', () => {
      const control = {
        errors: { maxlength: { requiredLength: 20 } },
      } as unknown as AbstractControl;
      expect(getFieldErrorDescriptor(control, 'User', 'username')).toEqual({
        key: 'errors.validation.maxLength',
        params: { count: 20 },
      });
    });

    it('when minlength present, then returns minLength descriptor', () => {
      const control = {
        errors: { minlength: { requiredLength: 3 } },
      } as unknown as AbstractControl;
      expect(getFieldErrorDescriptor(control, 'User', 'username')).toEqual({
        key: 'errors.validation.minLength',
        params: { count: 3 },
      });
    });

    it('when pattern fails due to short value, then returns minLength hint', () => {
      const control = {
        errors: { pattern: true },
        value: 'ab',
      } as unknown as AbstractControl;
      expect(getFieldErrorDescriptor(control, 'User', 'username')).toEqual({
        key: 'errors.validation.minLength',
        params: { count: 3 },
      });
    });

    it('when pattern fails due to long value, then returns maxLength hint', () => {
      const long = 'a'.repeat(51);
      const control = {
        errors: { pattern: true },
        value: long,
      } as unknown as AbstractControl;
      expect(getFieldErrorDescriptor(control, 'User', 'username')).toEqual({
        key: 'errors.validation.maxLength',
        params: { count: 50 },
      });
    });

    it('when pattern fails with invalid chars, then returns invalidChars descriptor', () => {
      const control = {
        errors: { pattern: true },
        value: 'bob!@#',
      } as unknown as AbstractControl;
      expect(getFieldErrorDescriptor(control, 'User', 'username')).toEqual({
        key: 'errors.validation.username.invalidChars',
        params: { chars: '!, @, #' },
      });
    });
  });

  describe('email field', () => {
    it('when required present, then returns requiredField', () => {
      const control = {
        errors: { required: true },
      } as unknown as AbstractControl;
      expect(getFieldErrorDescriptor(control, 'Email', 'email')).toEqual({
        key: 'errors.validation.requiredField',
        params: { field: 'Email' },
      });
    });

    it('when email invalid, then returns email key', () => {
      const control = { errors: { email: true } } as unknown as AbstractControl;
      expect(getFieldErrorDescriptor(control, 'Email', 'email')).toEqual({
        key: 'errors.validation.email',
      });
    });
  });

  describe('password field', () => {
    it('when minlength present, then returns password.minLength', () => {
      const control = {
        errors: { minlength: { requiredLength: 8 } },
      } as unknown as AbstractControl;
      expect(getFieldErrorDescriptor(control, 'Password', 'password')).toEqual({
        key: 'errors.validation.password.minLength',
        params: { count: 8 },
      });
    });

    it('when pattern present, then returns password.pattern', () => {
      const control = {
        errors: { pattern: true },
      } as unknown as AbstractControl;
      expect(getFieldErrorDescriptor(control, 'Password', 'password')).toEqual({
        key: 'errors.validation.password.pattern',
      });
    });
  });

  it('when terms field, then returns terms.required', () => {
    const control = {
      errors: { required: true },
    } as unknown as AbstractControl;
    expect(getFieldErrorDescriptor(control, 'Terms', 'terms')).toEqual({
      key: 'errors.validation.terms.required',
    });
  });

  it('when generic has required, then returns requiredField', () => {
    const control = {
      errors: { required: true },
    } as unknown as AbstractControl;
    expect(getFieldErrorDescriptor(control, 'Field')).toEqual({
      key: 'errors.validation.requiredField',
      params: { field: 'Field' },
    });
  });
});
