import { describe, expect, it } from 'vitest';
import { BreathEngine } from '../../apps/mobile/src/app/core/breath-engine/breath-engine';
import type { BreathPattern } from '../../shared/contracts/index';

const gentle: BreathPattern = {
  inhaleDuration: 4,
  exhaleDuration: 6,
  holdAfterInhale: 0,
  holdAfterExhale: 0,
};

describe('BreathEngine', () => {
  it('starts on inhale and reaches exhale at 4 seconds', () => {
    const engine = new BreathEngine(gentle, 180_000, () => 0);
    engine.start(0);

    const start = engine.snapshot(0);
    expect(start.phase).toBe('inhale');
    expect(start.progress).toBe(0);
    expect(start.phaseRemainingMs).toBe(4000);

    const midInhale = engine.snapshot(2000);
    expect(midInhale.phase).toBe('inhale');
    expect(midInhale.progress).toBeCloseTo(0.5);

    const exhale = engine.snapshot(4000);
    expect(exhale.phase).toBe('exhale');
    expect(exhale.progress).toBe(0);

    const midExhale = engine.snapshot(7000);
    expect(midExhale.phase).toBe('exhale');
    expect(midExhale.progress).toBeCloseTo(0.5);

    expect(engine.snapshot(10_000).phase).toBe('inhale');
  });

  it('seeks to a later point and keeps moving from there', () => {
    const engine = new BreathEngine(gentle, 180_000, () => 0);
    engine.start(0);
    engine.seek(7000, 10_000);

    const landed = engine.snapshot(10_000);
    expect(landed.sessionElapsedMs).toBe(7000);
    expect(landed.phase).toBe('exhale');
    expect(engine.snapshot(12_000).sessionElapsedMs).toBe(9000);
  });

  it('seeks while paused without letting time run', () => {
    const engine = new BreathEngine(gentle, 180_000, () => 0);
    engine.start(0);
    engine.pause(2000);
    engine.seek(7000, 99_000);

    const landed = engine.snapshot(120_000);
    expect(landed.paused).toBe(true);
    expect(landed.sessionElapsedMs).toBe(7000);
  });

  it('freezes elapsed time while paused and continues from there', () => {
    const engine = new BreathEngine(gentle, 180_000, () => 0);
    engine.start(0);
    engine.pause(2000);

    const frozen = engine.snapshot(9000);
    expect(frozen.paused).toBe(true);
    expect(frozen.sessionElapsedMs).toBe(2000);
    expect(frozen.phase).toBe('inhale');

    engine.resume(9000);
    const continued = engine.snapshot(10_000);
    expect(continued.paused).toBe(false);
    expect(continued.sessionElapsedMs).toBe(3000);
    expect(continued.phase).toBe('inhale');
    expect(continued.progress).toBeCloseTo(0.75);
  });

  it('finishes at 3 minutes and not one millisecond earlier', () => {
    const engine = new BreathEngine(gentle, 180_000, () => 0);
    engine.start(0);
    expect(engine.snapshot(179_999).finished).toBe(false);
    expect(engine.snapshot(180_000).finished).toBe(true);
    expect(engine.snapshot(180_000).sessionElapsedMs).toBe(180_000);
  });

  it('does not insert a hold phase when hold fields are non-zero', () => {
    const engine = new BreathEngine(
      { ...gentle, holdAfterInhale: 5, holdAfterExhale: 5 },
      180_000,
      () => 0,
    );
    engine.start(0);
    const atNineSeconds = engine.snapshot(9000);
    expect(atNineSeconds.phase).toBe('exhale');
    expect(atNineSeconds.progress).toBeCloseTo(5 / 6);
  });
});
