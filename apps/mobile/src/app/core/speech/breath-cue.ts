export const BREATH_CUES = {
  inhale: 'breath in',
  exhale: 'breath out',
  hold: 'hold',
} as const;

export type BreathCuePhase = keyof typeof BREATH_CUES;

export function breathCue(phase: string): string | null {
  if (phase === 'inhale' || phase === 'exhale' || phase === 'hold') {
    return BREATH_CUES[phase];
  }
  return null;
}
