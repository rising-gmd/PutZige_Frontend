import { CapitalizePipe } from './capitalize.pipe';

describe('CapitalizePipe', () => {
  const pipe = new CapitalizePipe();

  it('capitalizes a word', () => {
    expect(pipe.transform('hello')).toBe('Hello');
  });

  it('returns empty string for empty input', () => {
    expect(pipe.transform('')).toBe('');
  });
});
import { CapitalizePipe } from './capitalize.pipe';

describe('CapitalizePipe', () => {
  const pipe = new CapitalizePipe();
  it('capitalizes first letter', () => {
    expect(pipe.transform('hello')).toBe('Hello');
  });
  it('returns empty for falsy', () => {
    expect(pipe.transform('')).toBe('');
  });
});
