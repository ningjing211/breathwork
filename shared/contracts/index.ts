export type VisualPreset = 'orb' | 'wave' | 'particles';

/** 秒。 */
export interface BreathPattern {
  inhaleDuration: number;
  exhaleDuration: number;
  holdAfterInhale: number;
  holdAfterExhale: number;
}

export interface MusicTrack {
  id: string;
  title: string;
  file: string;
  /** 本次播放器不讀取。 */
  bpm: number;
}

export interface Affirmation {
  id: string;
  text: string;
  enabled: boolean;
}

/** `duration` 為毫秒。 */
export interface SessionPreset {
  id: string;
  title: string;
  description: string;
  duration: number;
  breathPattern: BreathPattern;
  musicTrack: MusicTrack;
  visualPreset: VisualPreset;
  affirmations: Affirmation[];
}

export interface UserSessionConfig {
  presetId: string;
  musicTrackId: string;
  visualPreset: VisualPreset;
  affirmations: Affirmation[];
}
