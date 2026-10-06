import type { BreathPhaseName } from '../breath-engine/breath-engine';

export interface BreathVisualState {
  phase: BreathPhaseName;
  progress: number;
}

/** 吸氣 0.72→1，吐氣 1→0.72。 */
export function breathAmount(state: BreathVisualState): number {
  const base = 0.72;
  const span = 0.28;
  if (state.phase === 'inhale') {
    return base + span * state.progress;
  }
  return base + span * (1 - state.progress);
}
