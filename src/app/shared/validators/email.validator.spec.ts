import { emailValidator } from './email.validator';

describe('email.validator', () => {
  const validator = emailValidator();

  it('returns null for empty value', () => {
    const control = { value: '' } as unknown as { value: string };
    expect(validator(control)).toBeNull();
  });

  it('validates correct email', () => {
    const control = { value: 'test@example.com' } as unknown as {
      value: string;
    };
    expect(validator(control)).toBeNull();
  });

  it('returns error for invalid email', () => {
    const control = { value: 'invalid-email' } as unknown as { value: string };
    expect(validator(control)).toEqual({ email: true });
  });
});
