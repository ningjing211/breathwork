import { describe, expect, it } from 'vitest';
import { GENTLE_BREATH, SESSION_PRESETS } from '../../apps/mobile/src/app/data/session-catalog';

describe('session catalog', () => {
  it('matches the four approved presets', () => {
    expect(SESSION_PRESETS.map((preset) => preset.title)).toEqual([
      '開始行動',
      '相信自己',
      '放下焦慮',
      '睡前放下',
    ]);

    for (const preset of SESSION_PRESETS) {
      expect(preset.duration).toBe(180_000);
      expect(preset.breathPattern).toEqual(GENTLE_BREATH);
      expect(preset.affirmations).toHaveLength(6);
      expect(preset.affirmations.every((item) => item.enabled)).toBe(true);
    }

    expect(GENTLE_BREATH).toEqual({
      inhaleDuration: 4,
      exhaleDuration: 6,
      holdAfterInhale: 0,
      holdAfterExhale: 0,
    });
  });
});
