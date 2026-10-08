import { describe, expect, it } from 'vitest';
import { guidedSpeech } from '../../apps/mobile/src/app/data/four78';
import {
  FOUR78_BREATH,
  FOUR78_DURATION_MS,
  GENTLE_BREATH,
  SESSION_PRESETS,
} from '../../apps/mobile/src/app/data/session-catalog';

describe('session catalog', () => {
  it('matches the approved presets', () => {
    expect(SESSION_PRESETS.map((preset) => preset.title)).toEqual([
      '開始行動',
      '相信自己',
      '放下焦慮',
      '睡前放下',
      '4-7-8',
    ]);

    for (const preset of SESSION_PRESETS.filter((item) => item.id !== 'four78')) {
      expect(preset.duration).toBe(180_000);
      expect(preset.breathPattern).toEqual(GENTLE_BREATH);
      expect(preset.affirmations).toHaveLength(6);
      expect(preset.affirmations.every((item) => item.enabled)).toBe(true);
    }

    const guided = SESSION_PRESETS.find((preset) => preset.id === 'four78');
    expect(guided?.duration).toBe(FOUR78_DURATION_MS);
    expect(guided?.duration).toBe(600_000);
    expect(guided?.breathPattern).toEqual(FOUR78_BREATH);
    expect(guided?.affirmations).toHaveLength(0);
    expect(guidedSpeech('inhale', 0, 1)?.text).toBe('inhale');
    expect(guidedSpeech('inhale', 0, 2)?.text).toBe('two');
    expect(guidedSpeech('hold', 0, 1)?.text).toBe('hold');
    expect(guidedSpeech('exhale', 0, 8)?.text).toBe('eight');
    expect(guidedSpeech('intro', 0, 1)?.text).toBe('Make yourself comfortable.');

    expect(GENTLE_BREATH).toEqual({
      inhaleDuration: 4,
      exhaleDuration: 6,
      holdAfterInhale: 0,
      holdAfterExhale: 0,
    });
  });
});
