import { requiredValidator } from './required.validator';
import { AbstractControl } from '@angular/forms';

describe('required.validator', () => {
  const validator = requiredValidator();

  it('returns error when empty', () => {
    const empty = { value: '' } as unknown as AbstractControl;
    expect(validator(empty)).toEqual({ required: true });
  });

  it('returns null when value present', () => {
    const present = { value: 'x' } as unknown as AbstractControl;
    expect(validator(present)).toBeNull();
  });
});
