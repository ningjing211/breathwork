import type { BreathPattern } from '@app/contracts';

export type BreathPhaseName = 'inhale' | 'exhale';

export interface BreathSnapshot {
  phase: BreathPhaseName;
  progress: number;
  phaseRemainingMs: number;
  sessionElapsedMs: number;
  finished: boolean;
  paused: boolean;
}

export class BreathEngine {
  private started = false;
  private paused = true;
  private originMs = 0;
  private elapsedBeforePauseMs = 0;

  constructor(
    private readonly pattern: BreathPattern,
    private readonly sessionDurationMs: number,
    private readonly now: () => number = () => performance.now(),
  ) {}

  start(at = this.now()): void {
    this.started = true;
    this.paused = false;
    this.elapsedBeforePauseMs = 0;
    this.originMs = at;
  }

  pause(at = this.now()): void {
    if (!this.started || this.paused) {
      return;
    }
    this.elapsedBeforePauseMs = this.elapsedMs(at);
    this.paused = true;
  }

  resume(at = this.now()): void {
    if (!this.started || !this.paused) {
      return;
    }
    this.originMs = at;
    this.paused = false;
  }

  seek(elapsedMs: number, at = this.now()): void {
    if (!this.started) {
      return;
    }
    this.elapsedBeforePauseMs = Math.min(this.sessionDurationMs, Math.max(0, elapsedMs));
    this.originMs = at;
  }

  snapshot(at = this.now()): BreathSnapshot {
    const rawElapsed = this.elapsedMs(at);
    const elapsed = Math.min(rawElapsed, this.sessionDurationMs);
    const inhaleMs = this.pattern.inhaleDuration * 1000;
    const exhaleMs = this.pattern.exhaleDuration * 1000;
    const cycleMs = inhaleMs + exhaleMs;
    const into = cycleMs === 0 ? 0 : elapsed % cycleMs;
    const phase: BreathPhaseName = into < inhaleMs || exhaleMs === 0 ? 'inhale' : 'exhale';
    const phaseElapsed = phase === 'inhale' ? into : into - inhaleMs;
    const phaseLength = phase === 'inhale' ? inhaleMs : exhaleMs;
    const progress = phaseLength === 0 ? 0 : Math.min(1, phaseElapsed / phaseLength);

    return {
      phase,
      progress,
      phaseRemainingMs: Math.max(0, phaseLength - phaseElapsed),
      sessionElapsedMs: elapsed,
      finished: this.started && rawElapsed >= this.sessionDurationMs,
      paused: !this.started || this.paused,
    };
  }

  private elapsedMs(at: number): number {
    if (!this.started) {
      return 0;
    }
    if (this.paused) {
      return this.elapsedBeforePauseMs;
    }
    return this.elapsedBeforePauseMs + (at - this.originMs);
  }
}
