import { describe, expect, it } from 'vitest';
import { breathAmount } from '../../apps/mobile/src/app/core/visual-engine/breath-scale';

describe('breathAmount', () => {
  it('expands through inhale and contracts through exhale', () => {
    expect(breathAmount({ phase: 'inhale', progress: 0 })).toBeCloseTo(0.72);
    expect(breathAmount({ phase: 'inhale', progress: 1 })).toBeCloseTo(1);
    expect(breathAmount({ phase: 'exhale', progress: 0 })).toBeCloseTo(1);
    expect(breathAmount({ phase: 'exhale', progress: 1 })).toBeCloseTo(0.72);
    expect(breathAmount({ phase: 'hold', progress: 0.4 })).toBeCloseTo(1);
    expect(breathAmount({ phase: 'intro', progress: 0.5 })).toBeCloseTo(0.72);
  });
});
