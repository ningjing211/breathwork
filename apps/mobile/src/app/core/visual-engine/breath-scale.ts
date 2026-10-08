import type { BreathPhaseName } from '../breath-engine/breath-engine';

export interface BreathVisualState {
  phase: BreathPhaseName;
  progress: number;
}

/** 吸氣 0.72→1，閉氣停在 1，吐氣 1→0.72。開頭與結尾停在 0.72。 */
export function breathAmount(state: BreathVisualState): number {
  const base = 0.72;
  const span = 0.28;
  if (state.phase === 'inhale') {
    return base + span * state.progress;
  }
  if (state.phase === 'hold') {
    return base + span;
  }
  if (state.phase === 'exhale') {
    return base + span * (1 - state.progress);
  }
  return base;
}
