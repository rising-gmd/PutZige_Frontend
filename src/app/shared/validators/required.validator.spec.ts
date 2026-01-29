import { requiredValidator } from './required.validator';

describe('required.validator', () => {
  const validator = requiredValidator();

  it('returns error when empty', () => {
    const empty = { value: '' } as unknown as { value: string };
    expect(validator(empty)).toEqual({ required: true });
  });

  it('returns null when value present', () => {
    const present = { value: 'x' } as unknown as { value: string };
    expect(validator(present)).toBeNull();
  });
});
