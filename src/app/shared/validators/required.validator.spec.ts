import { requiredValidator } from './required.validator';

describe('required.validator', () => {
  const validator = requiredValidator();

  it('returns error when empty', () => {
    expect(validator({ value: '' } as any)).toEqual({ required: true });
  });

  it('returns null when value present', () => {
    expect(validator({ value: 'x' } as any)).toBeNull();
  });
});
