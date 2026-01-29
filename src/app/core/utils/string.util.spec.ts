import { capitalize } from './string.util';

describe('string.util', () => {
  it('capitalizes strings', () => {
    expect(capitalize('world')).toBe('World');
  });
});
