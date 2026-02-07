import { getFormError } from './form-error.util';
import { AbstractControl } from '@angular/forms';

describe('getFormError', () => {
  it('when control is null, then returns null', () => {
    expect(getFormError(null, 'Label')).toBeNull();
  });

  describe('password kind', () => {
    it('when required then returns requiredField', () => {
      const control = {
        errors: { required: true },
      } as unknown as AbstractControl;
      expect(getFormError(control, 'Pwd', 'password')).toEqual({
        key: 'ERRORS.VALIDATION.REQUIRED_FIELD',
        params: { field: 'Pwd' },
      });
    });

    it('when minlength then returns password.minLength', () => {
      const control = {
        errors: { minlength: { requiredLength: 6 } },
      } as unknown as AbstractControl;
      expect(getFormError(control, 'Pwd', 'password')).toEqual({
        key: 'ERRORS.VALIDATION.PASSWORD.MIN_LENGTH',
        params: { count: 6 },
      });
    });

    it('when pattern then returns password.pattern', () => {
      const control = {
        errors: { pattern: true },
      } as unknown as AbstractControl;
      expect(getFormError(control, 'Pwd', 'password')).toEqual({
        key: 'ERRORS.VALIDATION.PASSWORD.PATTERN',
      });
    });
  });

  it('when terms kind then returns terms.required', () => {
    const control = {
      errors: { required: true },
    } as unknown as AbstractControl;
    expect(getFormError(control, 'T', 'terms')).toEqual({
      key: 'ERRORS.VALIDATION.TERMS.REQUIRED',
    });
  });

  describe('username kind', () => {
    it('when required then requiredField', () => {
      const control = {
        errors: { required: true },
      } as unknown as AbstractControl;
      expect(getFormError(control, 'U', 'username')).toEqual({
        key: 'ERRORS.VALIDATION.REQUIRED_FIELD',
        params: { field: 'U' },
      });
    });

    it('when maxlength then maxLength', () => {
      const control = {
        errors: { maxlength: { requiredLength: 30 } },
      } as unknown as AbstractControl;
      expect(getFormError(control, 'U', 'username')).toEqual({
        key: 'ERRORS.VALIDATION.MAX_LENGTH',
        params: { count: 30 },
      });
    });

    it('when pattern and short value then minLength hint', () => {
      const control = {
        errors: { pattern: true },
        value: 'ab',
      } as unknown as AbstractControl;
      expect(getFormError(control, 'U', 'username')).toEqual({
        key: 'ERRORS.VALIDATION.MIN_LENGTH',
        params: { count: 3 },
      });
    });

    it('when pattern with invalid chars then username.invalidChars', () => {
      const control = {
        errors: { pattern: true },
        value: 'x$y',
      } as unknown as AbstractControl;
      expect(getFormError(control, 'U', 'username')).toEqual({
        key: 'ERRORS.VALIDATION.USERNAME.INVALID_CHARS',
        params: { chars: '$' },
      });
    });
  });

  describe('generic messages', () => {
    it('when required then requiredField', () => {
      const control = {
        errors: { required: true },
      } as unknown as AbstractControl;
      expect(getFormError(control, 'Label')).toEqual({
        key: 'ERRORS.VALIDATION.REQUIRED_FIELD',
        params: { field: 'Label' },
      });
    });

    it('when email then email', () => {
      const control = { errors: { email: true } } as unknown as AbstractControl;
      expect(getFormError(control, 'Label')).toEqual({
        key: 'ERRORS.VALIDATION.EMAIL',
      });
    });

    it('when pattern and alpha-numeric value then username.pattern', () => {
      const control = {
        errors: { pattern: true },
        value: 'abc_123',
      } as unknown as AbstractControl;
      expect(getFormError(control, 'Label')).toEqual({
        key: 'ERRORS.VALIDATION.USERNAME.PATTERN',
      });
    });

    it('when pattern and non-alpha value then password.pattern', () => {
      const control = {
        errors: { pattern: true },
        value: 'a$b',
      } as unknown as AbstractControl;
      expect(getFormError(control, 'Label')).toEqual({
        key: 'ERRORS.VALIDATION.PASSWORD.PATTERN',
      });
    });
  });
});
