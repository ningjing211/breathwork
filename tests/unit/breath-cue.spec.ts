import { describe, expect, it } from 'vitest';
import { breathCue } from '../../apps/mobile/src/app/core/speech/breath-cue';

describe('breathCue', () => {
  it('maps inhale, exhale, and hold to the English phrases', () => {
    expect(breathCue('inhale')).toBe('breath in');
    expect(breathCue('exhale')).toBe('breath out');
    expect(breathCue('hold')).toBe('hold');
  });

  it('returns null for any other phase', () => {
    expect(breathCue('pause')).toBeNull();
  });
});
