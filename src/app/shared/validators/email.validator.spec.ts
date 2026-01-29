import { emailValidator } from './email.validator';

describe('email.validator', () => {
  const validator = emailValidator();

  it('returns null for empty value', () => {
    expect(validator({ value: '' } as any)).toBeNull();
  });

  it('validates correct email', () => {
    expect(validator({ value: 'test@example.com' } as any)).toBeNull();
  });

  it('returns error for invalid email', () => {
    expect(validator({ value: 'invalid-email' } as any)).toEqual({ email: true });
  });
});
