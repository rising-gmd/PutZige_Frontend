import { uniqueArray } from './array.util';

describe('array.util', () => {
  it('uniqueArray removes duplicates', () => {
    expect(uniqueArray([1, 2, 2, 3])).toEqual([1, 2, 3]);
  });
});
