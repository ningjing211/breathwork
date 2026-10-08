import type { BreathPattern } from '@app/contracts';

export type BreathPhaseName = 'inhale' | 'hold' | 'exhale' | 'intro' | 'close';

export interface BreathFrame {
  leadMs: number;
  closeMs: number;
}

export interface BreathSnapshot {
  phase: BreathPhaseName;
  /** 此相位內 0 到 1。 */
  progress: number;
  /** 此相位內第幾秒，從 1 起算。 */
  beat: number;
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
    private readonly frame?: BreathFrame,
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
    const placed = this.place(elapsed);
    const progress = placed.length === 0 ? 0 : Math.min(1, placed.elapsed / placed.length);

    return {
      phase: placed.phase,
      progress,
      beat: Math.floor(placed.elapsed / 1000) + 1,
      phaseRemainingMs: Math.max(0, placed.length - placed.elapsed),
      sessionElapsedMs: elapsed,
      finished: this.started && rawElapsed >= this.sessionDurationMs,
      paused: !this.started || this.paused,
    };
  }

  private place(elapsed: number): { phase: BreathPhaseName; elapsed: number; length: number } {
    const lead = this.frame?.leadMs ?? 0;
    const close = this.frame?.closeMs ?? 0;
    const closeStart = Math.max(lead, this.sessionDurationMs - close);
    if (lead > 0 && elapsed < lead) {
      return { phase: 'intro', elapsed, length: lead };
    }
    if (close > 0 && elapsed >= closeStart) {
      return { phase: 'close', elapsed: elapsed - closeStart, length: this.sessionDurationMs - closeStart };
    }

    const breathElapsed = elapsed - lead;
    const inhaleMs = this.pattern.inhaleDuration * 1000;
    const holdMs = this.pattern.holdAfterInhale * 1000;
    const exhaleMs = this.pattern.exhaleDuration * 1000;
    const cycleMs = inhaleMs + holdMs + exhaleMs;
    const into = cycleMs === 0 ? 0 : breathElapsed % cycleMs;
    if (into < inhaleMs || (exhaleMs === 0 && holdMs === 0)) {
      return { phase: 'inhale', elapsed: into, length: inhaleMs };
    }
    if (into < inhaleMs + holdMs) {
      return { phase: 'hold', elapsed: into - inhaleMs, length: holdMs };
    }
    return { phase: 'exhale', elapsed: into - inhaleMs - holdMs, length: exhaleMs };
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
