export const AFFIRMATION_FADE_MS = 1200;

export interface AffirmationFrame {
  index: number;
  opacity: number;
}

export function affirmationFrame(
  elapsedMs: number,
  sessionDurationMs: number,
  count: number,
): AffirmationFrame | null {
  if (count <= 0 || sessionDurationMs <= 0) {
    return null;
  }

  const slot = sessionDurationMs / count;
  const clamped = Math.min(Math.max(elapsedMs, 0), sessionDurationMs);
  let index = Math.floor(clamped / slot);
  if (index >= count) {
    index = count - 1;
  }

  const local = clamped - index * slot;
  const fade = Math.min(AFFIRMATION_FADE_MS, slot * 0.2);
  let opacity = 1;
  if (fade > 0) {
    if (local < fade) {
      opacity = local / fade;
    } else if (local > slot - fade) {
      opacity = Math.max(0, (slot - local) / fade);
    }
  }

  return { index, opacity };
}
