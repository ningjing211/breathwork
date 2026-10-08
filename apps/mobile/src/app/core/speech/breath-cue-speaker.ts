import { TextToSpeech } from '@capacitor-community/text-to-speech';
import { breathCue } from './breath-cue';

const SPEECH = {
  lang: 'en-US',
  category: 'ambient' as const,
  queueStrategy: 0 as const,
};

export class BreathCueSpeaker {
  private generation = 0;
  private job: Promise<void> = Promise.resolve();
  private waiters: Array<() => void> = [];

  prime(): void {
    this.enqueue(' ', 0);
  }

  speak(phase: string): void {
    const text = breathCue(phase);
    if (!text) {
      return;
    }
    this.enqueue(text, 1);
  }

  speakText(text: string): void {
    if (!text.trim()) {
      return;
    }
    this.enqueue(text, 1);
  }

  stop(): void {
    this.invalidate();
    this.job = this.job.then(() => this.halt()).catch(() => undefined);
  }

  private enqueue(text: string, volume: number): void {
    const id = this.invalidate();
    this.job = this.job
      .then(async () => {
        if (id !== this.generation) {
          return;
        }
        try {
          const spoken = TextToSpeech.speak({
            ...SPEECH,
            text,
            volume,
            rate: 1,
          }).then(
            () => undefined,
            () => undefined,
          );
          await Promise.race([spoken, this.cancelled(id)]);
          if (id !== this.generation) {
            await this.halt();
          }
        } catch {
          // 語音失敗不中斷這一輪。
        }
      })
      .catch(() => undefined);
  }

  private invalidate(): number {
    this.generation += 1;
    const pending = this.waiters;
    this.waiters = [];
    for (const wake of pending) {
      wake();
    }
    return this.generation;
  }

  private cancelled(id: number): Promise<void> {
    if (id !== this.generation) {
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      this.waiters.push(resolve);
    });
  }

  private async halt(): Promise<void> {
    try {
      await TextToSpeech.stop();
    } catch {
      // 語音失敗不中斷這一輪。
    }
  }
}
