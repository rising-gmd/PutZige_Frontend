import { TruncatePipe } from './truncate.pipe';

describe('TruncatePipe', () => {
  const pipe = new TruncatePipe();

  it('truncates long text to default length', () => {
    const text = 'abcdefghijklmnopqrstuvwxyz';
    const result = pipe.transform(text);
    expect(result.length).toBeLessThanOrEqual(text.length);
    expect(result).toContain('...');
  });

  it('returns original when shorter than length', () => {
    const text = 'short';
    expect(pipe.transform(text, 10)).toBe('short');
  });
});
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
