import { describe, expect, it } from 'vitest';
import { affirmationFrame } from '../../apps/mobile/src/app/core/affirmation-schedule';

describe('affirmationFrame', () => {
  it('returns null when there is nothing to show', () => {
    expect(affirmationFrame(0, 180_000, 0)).toBeNull();
  });

  it('splits the session and fades the edges', () => {
    const duration = 10_000;
    expect(affirmationFrame(0, duration, 2)).toEqual({ index: 0, opacity: 0 });
    expect(affirmationFrame(500, duration, 2)?.index).toBe(0);
    expect(affirmationFrame(500, duration, 2)?.opacity).toBeCloseTo(0.5);
    expect(affirmationFrame(2500, duration, 2)).toEqual({ index: 0, opacity: 1 });
    expect(affirmationFrame(5000, duration, 2)).toEqual({ index: 1, opacity: 0 });
  });
});
