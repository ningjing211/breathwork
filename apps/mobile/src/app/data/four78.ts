import type { BreathFrame, BreathPhaseName } from '../core/breath-engine/breath-engine';

export const FOUR78_LEAD_MS = 15_000;
export const FOUR78_CLOSE_MS = 15_000;
export const FOUR78_CYCLE_MS = 19_000;
export const FOUR78_CYCLES = 30;

export const FOUR78_FRAME: BreathFrame = {
  leadMs: FOUR78_LEAD_MS,
  closeMs: FOUR78_CLOSE_MS,
};

const INTRO = [
  'Make yourself comfortable.',
  'Inhale through your nose for four.',
  'Hold for seven.',
  'Exhale through your mouth for eight.',
] as const;

const CLOSE = [
  'Let your breathing return to its natural rhythm.',
  'Sit quietly for a moment.',
] as const;

const CYCLE_WORDS = {
  inhale: ['inhale', 'two', 'three', 'four'],
  hold: ['hold', 'two', 'three', 'four', 'five', 'six', 'seven'],
  exhale: ['exhale', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight'],
} as const;

export function isFour78(presetId: string): boolean {
  return presetId === 'four78';
}

export function guidedSpeech(
  phase: BreathPhaseName,
  progress: number,
  beat: number,
): { key: string; text: string } | null {
  if (phase === 'intro' || phase === 'close') {
    const lines = phase === 'intro' ? INTRO : CLOSE;
    const index =
      progress >= 1 ? lines.length - 1 : Math.min(lines.length - 1, Math.floor(progress * lines.length));
    return { key: `${phase}:${index}`, text: lines[index] ?? '' };
  }
  if (phase !== 'inhale' && phase !== 'hold' && phase !== 'exhale') {
    return null;
  }
  const words = CYCLE_WORDS[phase];
  const index = Math.min(words.length, Math.max(1, beat)) - 1;
  return { key: `${phase}:${index}`, text: words[index] ?? '' };
}
