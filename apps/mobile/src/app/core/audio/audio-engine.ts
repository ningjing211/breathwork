export type AudioStatus = 'idle' | 'playing' | 'paused';

export function loopOffsetSec(sessionElapsedSec: number, loopDurationSec: number): number {
  if (loopDurationSec <= 0) {
    return 0;
  }
  const wrapped = sessionElapsedSec % loopDurationSec;
  return wrapped < 0 ? wrapped + loopDurationSec : wrapped;
}

export interface GainAutomation {
  value: number;
  cancelScheduledValues(time: number): void;
  setValueAtTime(value: number, time: number): void;
  linearRampToValueAtTime(value: number, time: number): void;
}

export interface AudioBufferLike {
  duration: number;
}

export interface BufferSourceLike {
  buffer: AudioBufferLike | null;
  loop: boolean;
  connect(node: unknown): void;
  start(when: number, offset?: number): void;
  stop(): void;
}

export interface GainNodeLike {
  gain: GainAutomation;
  connect(node: unknown): void;
}

export interface AudioContextLike {
  currentTime: number;
  destination: object;
  resume(): Promise<void>;
  createGain(): GainNodeLike;
  createBufferSource(): BufferSourceLike;
  decodeAudioData(data: ArrayBuffer): Promise<AudioBufferLike>;
}

export interface AudioDeps {
  createContext(): AudioContextLike;
  fetchBuffer(url: string): Promise<ArrayBuffer>;
  sleep(ms: number): Promise<void>;
}

export function browserAudioDeps(): AudioDeps {
  return {
    createContext: () => new AudioContext(),
    fetchBuffer: async (url) => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`audio ${response.status}`);
      }
      return response.arrayBuffer();
    },
    sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  };
}

export class AudioEngine {
  private context: AudioContextLike | null = null;
  private gain: GainNodeLike | null = null;
  private buffer: AudioBufferLike | null = null;
  private source: BufferSourceLike | null = null;
  private loadedUrl: string | null = null;
  private offset = 0;
  private startedAt = 0;
  private volume = 0.8;
  private fadeToken = 0;
  private state: AudioStatus = 'idle';

  constructor(private readonly deps: AudioDeps) {}

  get status(): AudioStatus {
    return this.state;
  }

  prime(): void {
    void this.ensure().resume();
  }

  async load(url: string): Promise<void> {
    if (this.loadedUrl === url && this.buffer) {
      return;
    }
    const bytes = await this.deps.fetchBuffer(url);
    this.buffer = await this.ensure().decodeAudioData(bytes.slice(0));
    this.loadedUrl = url;
    this.offset = 0;
  }

  async play(fadeMs = 1500, sessionElapsedSec = 0): Promise<void> {
    if (!this.buffer) {
      throw new Error('audio not loaded');
    }
    await this.ensure().resume();
    this.offset = loopOffsetSec(sessionElapsedSec, this.buffer.duration);
    this.startSource(fadeMs);
    this.state = 'playing';
  }

  place(sessionElapsedSec: number): void {
    if (!this.buffer || this.state === 'idle') {
      return;
    }
    this.offset = loopOffsetSec(sessionElapsedSec, this.buffer.duration);
    if (this.state === 'playing') {
      this.startSource(0);
    }
  }

  pause(): void {
    if (this.state !== 'playing' || !this.context) {
      return;
    }
    this.offset = Math.max(0, this.context.currentTime - this.startedAt);
    this.stopSource();
    this.state = 'paused';
  }

  resume(): void {
    if (this.state !== 'paused' || !this.buffer) {
      return;
    }
    this.startSource(0);
    this.state = 'playing';
  }

  stop(): void {
    this.fadeToken += 1;
    this.stopSource();
    this.offset = 0;
    this.state = 'idle';
    this.silence();
  }

  async fadeOut(ms = 1500): Promise<void> {
    const token = this.fadeToken + 1;
    this.fadeToken = token;
    if (this.state === 'playing' && this.gain && this.context) {
      const now = this.context.currentTime;
      this.gain.gain.cancelScheduledValues(now);
      this.gain.gain.setValueAtTime(this.volume, now);
      this.gain.gain.linearRampToValueAtTime(0, now + ms / 1000);
      await this.deps.sleep(ms);
    }
    if (token !== this.fadeToken) {
      return;
    }
    this.stopSource();
    this.offset = 0;
    this.state = 'idle';
    this.silence();
  }

  setVolume(value: number): void {
    this.volume = Math.min(1, Math.max(0, value));
    if (this.state === 'playing' && this.gain && this.context) {
      this.gain.gain.setValueAtTime(this.volume, this.context.currentTime);
    }
  }

  private ensure(): AudioContextLike {
    if (!this.context || !this.gain) {
      this.context = this.deps.createContext();
      this.gain = this.context.createGain();
      this.gain.connect(this.context.destination);
      this.gain.gain.setValueAtTime(0, this.context.currentTime);
    }
    return this.context;
  }

  private startSource(fadeMs: number): void {
    this.fadeToken += 1;
    this.stopSource();
    const context = this.ensure();
    const gain = this.gain;
    if (!gain) {
      throw new Error('audio gain missing');
    }
    const source = context.createBufferSource();
    source.buffer = this.buffer;
    source.loop = true;
    source.connect(gain);
    const now = context.currentTime;
    gain.gain.cancelScheduledValues(now);
    if (fadeMs <= 0) {
      gain.gain.setValueAtTime(this.volume, now);
    } else {
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(this.volume, now + fadeMs / 1000);
    }
    source.start(0, this.offset);
    this.startedAt = now - this.offset;
    this.source = source;
  }

  private stopSource(): void {
    const source = this.source;
    this.source = null;
    if (!source) {
      return;
    }
    try {
      source.stop();
    } catch {
      // 已經停過。
    }
  }

  private silence(): void {
    if (!this.gain || !this.context) {
      return;
    }
    const now = this.context.currentTime;
    this.gain.gain.cancelScheduledValues(now);
    this.gain.gain.setValueAtTime(0, now);
  }
}

export function audioEngineFactory(): AudioEngine {
  return new AudioEngine(browserAudioDeps());
}
