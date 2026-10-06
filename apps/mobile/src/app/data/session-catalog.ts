import type { Affirmation, BreathPattern, MusicTrack, SessionPreset } from '@app/contracts';

export const SESSION_DURATION_MS = 180_000;

export const GENTLE_BREATH: BreathPattern = {
  inhaleDuration: 4,
  exhaleDuration: 6,
  holdAfterInhale: 0,
  holdAfterExhale: 0,
};

export const MUSIC_TRACKS: readonly MusicTrack[] = [
  { id: 'ambient', title: 'Ambient', file: '/audio/ambient.wav', bpm: 60 },
  { id: 'organic', title: 'Organic', file: '/audio/organic.wav', bpm: 72 },
  { id: 'deep', title: 'Deep', file: '/audio/deep.wav', bpm: 48 },
];

function track(id: string): MusicTrack {
  const found = MUSIC_TRACKS.find((item) => item.id === id);
  if (!found) {
    throw new Error(`missing track ${id}`);
  }
  return found;
}

function lines(presetId: string, texts: readonly string[]): Affirmation[] {
  return texts.map((text, index) => ({
    id: `${presetId}-${index + 1}`,
    text,
    enabled: true,
  }));
}

export const SESSION_PRESETS: readonly SessionPreset[] = [
  {
    id: 'start',
    title: '開始行動',
    description: '把拖延留在這一小段呼吸裡，先動一步。',
    duration: SESSION_DURATION_MS,
    breathPattern: GENTLE_BREATH,
    musicTrack: track('ambient'),
    visualPreset: 'orb',
    affirmations: lines('start', [
      '我可以先做很小的一步。',
      '開始比完美更重要。',
      '我不需要一次做完。',
      '我允許自己現在就動。',
      '這一步已經夠了。',
      '我正在把意願變成行動。',
    ]),
  },
  {
    id: 'trust',
    title: '相信自己',
    description: '把懷疑放輕，回到自己的選擇。',
    duration: SESSION_DURATION_MS,
    breathPattern: GENTLE_BREATH,
    musicTrack: track('organic'),
    visualPreset: 'wave',
    affirmations: lines('trust', [
      '我可以相信自己的選擇。',
      '我不需要一次知道所有答案。',
      '我的判斷值得被聽見。',
      '我已經走過不少路。',
      '我可以慢慢來，仍然向前。',
      '我站在自己這一邊。',
    ]),
  },
  {
    id: 'ease',
    title: '放下焦慮',
    description: '讓這一口氣比念頭更近。',
    duration: SESSION_DURATION_MS,
    breathPattern: GENTLE_BREATH,
    musicTrack: track('ambient'),
    visualPreset: 'particles',
    affirmations: lines('ease', [
      '我把注意力放回這一口氣。',
      '緊張可以在，我不跟著它跑。',
      '此刻只需要這一息。',
      '我不必把所有事一次解決。',
      '我讓肩膀鬆一點。',
      '這一口氣，我放下一點。',
    ]),
  },
  {
    id: 'sleep',
    title: '睡前放下',
    description: '把白天還沒想完的，先放在門外。',
    duration: SESSION_DURATION_MS,
    breathPattern: GENTLE_BREATH,
    musicTrack: track('deep'),
    visualPreset: 'wave',
    affirmations: lines('sleep', [
      '今天的事可以留到明天。',
      '我允許身體慢慢沉下來。',
      '想了夠多了，現在可以休息。',
      '我把未完成的事先放下。',
      '夜色只是休息的開始。',
      '我讓呼吸帶我進入安靜。',
    ]),
  },
];

export function getPreset(id: string): SessionPreset | undefined {
  return SESSION_PRESETS.find((preset) => preset.id === id);
}

export function getTrack(id: string): MusicTrack | undefined {
  return MUSIC_TRACKS.find((item) => item.id === id);
}

export function formatDuration(durationMs: number): string {
  return `${Math.round(durationMs / 60_000)} 分鐘`;
}
