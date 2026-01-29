import { formatDate } from './date.util';

describe('date.util', () => {
  it('formats date to ISO string', () => {
    const d = new Date('2020-01-01T00:00:00.000Z');
    expect(formatDate(d)).toBe(d.toISOString());
  });
});
