import { TruncatePipe } from './truncate.pipe';

describe('TruncatePipe', () => {
  const pipe = new TruncatePipe();
  it('truncates strings longer than limit', () => {
    expect(pipe.transform('abcdefghijklmnopqrstuvwxyz', 10)).toBe(
      'abcdefghij...',
    );
  });
  it('returns original when shorter', () => {
    expect(pipe.transform('short', 10)).toBe('short');
  });
});
