import { decodeJwt } from './jwt.util';

describe('jwt.util', () => {
  it('returns null for invalid token', () => {
    expect(decodeJwt('invalid.token')).toBeNull();
  });
});
