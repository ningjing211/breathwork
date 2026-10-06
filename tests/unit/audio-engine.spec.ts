import { describe, expect, it } from 'vitest';
import {
  AudioEngine,
  type AudioBufferLike,
  type AudioContextLike,
  type AudioDeps,
  type BufferSourceLike,
  type GainNodeLike,
} from '../../apps/mobile/src/app/core/audio/audio-engine';

class MockSource implements BufferSourceLike {
  buffer: AudioBufferLike | null = null;
  loop = false;
  offset = 0;
  stopped = false;

  connect(): void {}

  start(_when: number, offset = 0): void {
    this.offset = offset;
  }

  stop(): void {
    this.stopped = true;
  }
}

function harness() {
  const sources: MockSource[] = [];
  const ramps: number[] = [];
  let slept = 0;
  const gain: GainNodeLike = {
    gain: {
      value: 0,
      cancelScheduledValues() {},
      setValueAtTime(value: number) {
        this.value = value;
      },
      linearRampToValueAtTime(value: number) {
        this.value = value;
        ramps.push(value);
      },
    },
    connect() {},
  };
  const context: AudioContextLike = {
    currentTime: 0,
    destination: {},
    async resume() {},
    createGain: () => gain,
    createBufferSource() {
      const source = new MockSource();
      sources.push(source);
      return source;
    },
    async decodeAudioData() {
      return { duration: 6 };
    },
  };
  const deps: AudioDeps = {
    createContext: () => context,
    fetchBuffer: async () => new ArrayBuffer(8),
    sleep: async (ms) => {
      slept = ms;
    },
  };
  return {
    engine: new AudioEngine(deps),
    context,
    sources,
    ramps,
    slept: () => slept,
  };
}

describe('AudioEngine', () => {
  it('stops the previous source when play is called again', async () => {
    const { engine, sources } = harness();
    await engine.load('/audio/ambient.wav');
    await engine.play(0);
    await engine.play(0);

    expect(sources).toHaveLength(2);
    expect(sources[0]?.stopped).toBe(true);
    expect(sources[1]?.stopped).toBe(false);
    expect(engine.status).toBe('playing');
  });

  it('resumes from the paused offset', async () => {
    const { engine, context, sources } = harness();
    await engine.load('/audio/deep.wav');
    await engine.play(0);
    context.currentTime = 2.5;
    engine.pause();
    context.currentTime = 9;
    engine.resume();

    expect(engine.status).toBe('playing');
    expect(sources.at(-1)?.offset).toBeCloseTo(2.5);
  });

  it('stops immediately', async () => {
    const { engine, sources } = harness();
    await engine.load('/audio/organic.wav');
    await engine.play(0);
    engine.stop();

    expect(sources[0]?.stopped).toBe(true);
    expect(engine.status).toBe('idle');
  });

  it('fades out and then stops', async () => {
    const { engine, sources, ramps, slept } = harness();
    await engine.load('/audio/ambient.wav');
    await engine.play(0);
    await engine.fadeOut(1500);

    expect(slept()).toBe(1500);
    expect(ramps).toContain(0);
    expect(sources.at(-1)?.stopped).toBe(true);
    expect(engine.status).toBe('idle');
  });
});
