import { TextToSpeech } from '@capacitor-community/text-to-speech';
import { breathCue } from './breath-cue';

const SPEECH = {
  lang: 'en-US',
  category: 'ambient' as const,
  queueStrategy: 0 as const,
};

export class BreathCueSpeaker {
  prime(): void {
    this.say(' ', 0);
  }

  speak(phase: string): void {
    const text = breathCue(phase);
    if (!text) {
      return;
    }
    this.say(text, 1);
  }

  stop(): void {
    try {
      void TextToSpeech.stop().catch(() => undefined);
    } catch {
      // 語音失敗不中斷這一輪。
    }
  }

  private say(text: string, volume: number): void {
    try {
      void TextToSpeech.speak({
        ...SPEECH,
        text,
        volume,
        rate: 1,
      }).catch(() => undefined);
    } catch {
      // SpeechSynthesis 有時會同步丟出例外。
    }
  }
}
