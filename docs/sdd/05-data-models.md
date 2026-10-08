# 05 資料模型

型別在 `shared/contracts`。內容在 `apps/mobile/src/app/data/session-catalog.ts`。沒有 Firestore。

時間單位：呼吸欄位是秒，`SessionPreset.duration` 是毫秒。四個預設都是 `180000`。

```ts
interface BreathPattern {
  inhaleDuration: number;
  exhaleDuration: number;
  holdAfterInhale: number;
  holdAfterExhale: number;
}

interface MusicTrack {
  id: string;
  title: string;
  file: string;
  bpm: number;
}

interface Affirmation {
  id: string;
  text: string;
  enabled: boolean;
}

interface SessionPreset {
  id: string;
  title: string;
  description: string;
  duration: number;
  breathPattern: BreathPattern;
  musicTrack: MusicTrack;
  visualPreset: 'orb' | 'wave' | 'particles';
  affirmations: Affirmation[];
}

interface UserSessionConfig {
  presetId: string;
  musicTrackId: string;
  visualPreset: 'orb' | 'wave' | 'particles';
  affirmations: Affirmation[];
}
```

前四個預設的呼吸：吸氣 4、吐氣 6、兩個閉氣 0。4-7-8：吸氣 4、吸氣後閉氣 7、吐氣 8、吐氣後閉氣 0，時長 600000 毫秒。4-7-8 沒有肯定句。

| 音樂 id | 標題 | 檔案 | bpm |
| --- | --- | --- | --- |
| ambient | Ambient | `/audio/ambient.wav` | 60 |
| organic | Organic | `/audio/organic.wav` | 72 |
| deep | Deep | `/audio/deep.wav` | 48 |

`bpm` 本次只作為資料，播放器不拿它做視覺。

| 預設 | 預設音樂 | 預設視覺 |
| --- | --- | --- |
| start 開始行動 | ambient | orb |
| trust 相信自己 | organic | wave |
| ease 放下焦慮 | ambient | particles |
| sleep 睡前放下 | deep | wave |
| four78 4-7-8 | deep | wave |

肯定句預設 `enabled: true`。

### 開始行動

1. 我可以先做很小的一步。
2. 開始比完美更重要。
3. 我不需要一次做完。
4. 我允許自己現在就動。
5. 這一步已經夠了。
6. 我正在把意願變成行動。

### 相信自己

1. 我可以相信自己的選擇。
2. 我不需要一次知道所有答案。
3. 我的判斷值得被聽見。
4. 我已經走過不少路。
5. 我可以慢慢來，仍然向前。
6. 我站在自己這一邊。

### 放下焦慮

1. 我把注意力放回這一口氣。
2. 緊張可以在，我不跟著它跑。
3. 此刻只需要這一息。
4. 我不必把所有事一次解決。
5. 我讓肩膀鬆一點。
6. 這一口氣，我放下一點。

### 睡前放下

1. 今天的事可以留到明天。
2. 我允許身體慢慢沉下來。
3. 想了夠多了，現在可以休息。
4. 我把未完成的事先放下。
5. 夜色只是休息的開始。
6. 我讓呼吸帶我進入安靜。
