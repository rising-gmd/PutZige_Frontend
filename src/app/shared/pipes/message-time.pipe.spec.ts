import { MessageTimePipe } from './message-time.pipe';

describe('MessageTimePipe', () => {
  const pipe = new MessageTimePipe();

  test('transforms a Date/string to a non-empty string', () => {
    const s1 = pipe.transform(new Date('2026-02-14T10:00:00'));
    const s2 = pipe.transform('2026-02-14T10:00:00');
    expect(typeof s1).toBe('string');
    expect(s1.length).toBeGreaterThan(0);
    expect(typeof s2).toBe('string');
    expect(s2.length).toBeGreaterThan(0);
  });
});
