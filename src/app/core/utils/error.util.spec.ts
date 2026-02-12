import { extractErrorMessage } from './error.util';

describe('extractErrorMessage', () => {
  it('returns Unknown error for null/undefined', () => {
    expect(extractErrorMessage(undefined)).toBe('Unknown error');
    expect(extractErrorMessage(null)).toBe('Unknown error');
  });

  it('returns string as-is', () => {
    expect(extractErrorMessage('oops')).toBe('oops');
  });

  it('returns Error.message for Error instances', () => {
    expect(extractErrorMessage(new Error('boom'))).toBe('boom');
  });

  it('extracts message property from plain object', () => {
    expect(extractErrorMessage({ message: 'server err' })).toBe('server err');
  });

  it('falls back to String(err) and handles toString throwing', () => {
    // object with toString that throws
    const bad = {
      toString: () => {
        throw new Error('nope');
      },
    };
    expect(extractErrorMessage(bad)).toBe('Unknown error');
  });
});
