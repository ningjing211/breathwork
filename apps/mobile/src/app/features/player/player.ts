import {
  afterNextRender,
  Component,
  ElementRef,
  inject,
  NgZone,
  OnDestroy,
  signal,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { affirmationFrame } from '../../core/affirmation-schedule';
import { AudioEngine } from '../../core/audio/audio-engine';
import { BreathEngine, type BreathPhaseName } from '../../core/breath-engine/breath-engine';
import { BreathCueSpeaker } from '../../core/speech/breath-cue-speaker';
import { createVisualRenderer } from '../../core/visual-engine/create-visual';
import type { VisualRenderer } from '../../core/visual-engine/surface';
import { FOUR78_FRAME, guidedSpeech, isFour78 } from '../../data/four78';
import { getPreset, getTrack } from '../../data/session-catalog';
import { SessionDraft } from '../../data/session-draft';

const PRESET_COLOR: Record<string, number> = {
  start: 0xd7a15f,
  trust: 0xe6d3a3,
  ease: 0x7f9c98,
  sleep: 0x9a8aa8,
  four78: 0x8fa3b0,
};

@Component({
  selector: 'mobile-player',
  host: { class: 'ion-page' },
  templateUrl: './player.html',
})
export class Player implements OnDestroy {
  private readonly router = inject(Router);
  private readonly zone = inject(NgZone);
  private readonly draft = inject(SessionDraft);
  private readonly audio = inject(AudioEngine);
  private readonly cues = new BreathCueSpeaker();
  private readonly host = viewChild<ElementRef<HTMLElement>>('visualHost');

  private breath: BreathEngine | null = null;
  private visual: VisualRenderer | null = null;
  private frame = 0;
  protected durationMs = 180_000;
  private spokenPhase: BreathPhaseName | null = null;
  private spokenKey: string | null = null;
  private phase: BreathPhaseName = 'inhale';
  private guided = false;
  private trackFile = '';
  private musicRequest = 0;
  private enabledLines: string[] = [];
  private leaving = false;
  private exited = false;
  private scrubbing = false;

  protected readonly title = signal('');
  protected readonly phaseLabel = signal('吸氣');
  protected readonly countText = signal('4 秒');
  protected readonly line = signal('');
  protected readonly opacity = signal(0);
  protected readonly progress = signal(0);
  protected readonly elapsedMs = signal(0);
  protected readonly elapsedLabel = signal('0:00');
  protected readonly totalLabel = signal('3:00');
  protected readonly paused = signal(false);
  protected readonly failed = signal(false);
  protected readonly voiceOn = signal(false);
  protected readonly musicOn = signal(false);
  protected readonly musicHint = signal('');

  constructor() {
    const config = this.draft.get();
    const preset = config ? getPreset(config.presetId) : undefined;
    if (!config || !preset) {
      void this.router.navigateByUrl('/');
      return;
    }
    const track = getTrack(config.musicTrackId);
    if (!track) {
      this.failed.set(true);
      return;
    }
    this.title.set(preset.title);
    this.durationMs = preset.duration;
    this.totalLabel.set(formatClock(preset.duration));
    this.guided = isFour78(preset.id);
    if (this.guided) {
      this.voiceOn.set(true);
      this.countText.set('1');
    }
    this.enabledLines = config.affirmations
      .filter((item) => item.enabled && item.text.trim())
      .map((item) => item.text);
    this.trackFile = track.file;
    this.breath = new BreathEngine(
      preset.breathPattern,
      preset.duration,
      undefined,
      this.guided ? FOUR78_FRAME : undefined,
    );
    this.visual = createVisualRenderer(
      config.visualPreset,
      PRESET_COLOR[preset.id] ?? PRESET_COLOR['start'],
    );

    afterNextRender(() => {
      void this.mount();
    });
  }

  protected toggleMusic(): void {
    if (this.leaving || this.failed()) {
      return;
    }
    if (this.musicOn()) {
      this.musicOn.set(false);
      this.musicHint.set('');
      this.musicRequest += 1;
      this.audio.stop();
      return;
    }
    this.musicOn.set(true);
    this.musicHint.set('');
    this.audio.prime();
    if (this.paused()) {
      return;
    }
    void this.startMusic();
  }

  protected toggleVoice(): void {
    if (this.leaving || this.failed()) {
      return;
    }
    if (this.voiceOn()) {
      this.voiceOn.set(false);
      this.cues.stop();
      return;
    }
    this.voiceOn.set(true);
    if (this.paused() || !this.breath) {
      return;
    }
    this.voiceNow(true);
  }

  protected toggle(): void {
    if (!this.breath || this.leaving || this.failed()) {
      return;
    }
    if (this.paused()) {
      this.breath.resume();
      this.paused.set(false);
      if (this.musicOn()) {
        if (this.audio.status === 'paused') {
          this.audio.resume();
        } else if (this.audio.status !== 'playing') {
          void this.startMusic();
        }
      }
      if (this.voiceOn()) {
        this.voiceNow(true);
      }
      this.zone.runOutsideAngular(() => this.tick());
      return;
    }
    this.breath.pause();
    if (this.musicOn()) {
      this.audio.pause();
    }
    this.cues.stop();
    cancelAnimationFrame(this.frame);
    this.paused.set(true);
  }

  protected scrubStart(event: PointerEvent): void {
    if (!this.breath || this.leaving || this.failed() || this.durationMs <= 0) {
      return;
    }
    const target = event.currentTarget;
    if (target instanceof HTMLElement) {
      target.setPointerCapture(event.pointerId);
    }
    this.scrubbing = true;
    this.seekTo(this.ratioFrom(event), false);
  }

  protected scrubMove(event: PointerEvent): void {
    if (!this.scrubbing) {
      return;
    }
    this.seekTo(this.ratioFrom(event), false);
  }

  protected scrubEnd(event: PointerEvent): void {
    if (!this.scrubbing) {
      return;
    }
    this.scrubbing = false;
    this.seekTo(this.ratioFrom(event), true);
  }

  protected scrubKey(event: KeyboardEvent): void {
    if (!this.breath || this.leaving || this.failed() || this.durationMs <= 0) {
      return;
    }
    const current = this.breath.snapshot().sessionElapsedMs;
    let next = current;
    if (event.key === 'ArrowRight') {
      next = current + 5000;
    } else if (event.key === 'ArrowLeft') {
      next = current - 5000;
    } else if (event.key === 'Home') {
      next = 0;
    } else if (event.key === 'End') {
      next = this.durationMs;
    } else {
      return;
    }
    event.preventDefault();
    this.seekTo(next / this.durationMs, true);
  }

  protected exit(): void {
    this.exited = true;
    this.shutdown();
    this.draft.clear();
    void this.router.navigateByUrl('/');
  }

  ngOnDestroy(): void {
    this.exited = true;
    this.shutdown();
  }

  private async mount(): Promise<void> {
    const element = this.host()?.nativeElement;
    if (!this.breath || !this.visual || !element || this.exited) {
      return;
    }
    try {
      await this.visual.mount(element);
      if (this.exited) {
        this.shutdown();
        return;
      }
      this.breath.start();
      this.zone.runOutsideAngular(() => this.tick());
    } catch {
      this.shutdown();
      this.failed.set(true);
    }
  }

  private async startMusic(): Promise<void> {
    const request = ++this.musicRequest;
    try {
      await this.audio.load(this.trackFile);
      if (request !== this.musicRequest || !this.musicOn() || this.leaving || this.paused()) {
        return;
      }
      if (this.audio.status === 'paused') {
        this.audio.resume();
        return;
      }
      if (this.audio.status !== 'playing') {
        const elapsedSec = (this.breath?.snapshot().sessionElapsedMs ?? 0) / 1000;
        await this.audio.play(1500, elapsedSec);
      }
    } catch {
      if (request !== this.musicRequest || this.leaving) {
        return;
      }
      this.musicOn.set(false);
      this.audio.stop();
      this.musicHint.set('音樂載入失敗，請再試一次');
    }
  }

  private tick = (): void => {
    if (this.leaving || !this.breath) {
      return;
    }
    const snap = this.breath.snapshot();
    this.phase = snap.phase;
    this.visual?.render({ phase: snap.phase, progress: snap.progress });
    if (!this.scrubbing && !snap.finished) {
      this.voiceNow(false);
    }
    this.zone.run(() =>
      this.apply(snap.phase, snap.phaseRemainingMs, snap.sessionElapsedMs, snap.beat, snap.progress),
    );
    if (snap.finished && !this.scrubbing) {
      this.zone.run(() => {
        void this.finish();
      });
      return;
    }
    this.frame = requestAnimationFrame(this.tick);
  };

  private apply(
    phase: BreathPhaseName,
    phaseRemainingMs: number,
    elapsedMs: number,
    beat = 1,
    progress = 0,
  ): void {
    this.phaseLabel.set(phaseLabel(phase, this.guided));
    this.countText.set(countLabel(phase, beat, phaseRemainingMs, this.guided));
    this.elapsedMs.set(elapsedMs);
    this.elapsedLabel.set(formatClock(elapsedMs));
    this.progress.set(this.durationMs === 0 ? 0 : (elapsedMs / this.durationMs) * 100);
    if (this.guided && (phase === 'intro' || phase === 'close')) {
      const speech = guidedSpeech(phase, progress, beat);
      this.line.set(speech?.text ?? '');
      this.opacity.set(speech ? 1 : 0);
      return;
    }
    const shown = affirmationFrame(elapsedMs, this.durationMs, this.enabledLines.length);
    this.line.set(shown ? (this.enabledLines[shown.index] ?? '') : '');
    this.opacity.set(shown?.opacity ?? 0);
  }

  private async finish(): Promise<void> {
    if (this.leaving) {
      return;
    }
    this.leaving = true;
    cancelAnimationFrame(this.frame);
    this.cues.stop();
    try {
      await this.audio.fadeOut(1500);
    } catch {
      this.audio.stop();
    }
    if (this.exited) {
      return;
    }
    this.destroyVisual();
    await this.router.navigateByUrl('/session/complete');
  }

  private shutdown(): void {
    this.leaving = true;
    cancelAnimationFrame(this.frame);
    this.destroyVisual();
    this.audio.stop();
    this.cues.stop();
  }

  private destroyVisual(): void {
    this.visual?.destroy();
    this.visual = null;
  }

  private ratioFrom(event: PointerEvent): number {
    const target = event.currentTarget;
    if (!(target instanceof HTMLElement)) {
      return 0;
    }
    const rect = target.getBoundingClientRect();
    if (rect.width <= 0) {
      return 0;
    }
    return Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
  }

  private seekTo(ratio: number, commit: boolean): void {
    if (!this.breath || this.leaving) {
      return;
    }
    const elapsed = Math.min(this.durationMs, Math.max(0, ratio * this.durationMs));
    this.breath.seek(elapsed);
    const snap = this.breath.snapshot();
    this.phase = snap.phase;
    this.visual?.render({ phase: snap.phase, progress: snap.progress });
    if (commit && this.musicOn() && this.audio.status !== 'idle') {
      this.audio.place(snap.sessionElapsedMs / 1000);
    }
    this.apply(snap.phase, snap.phaseRemainingMs, snap.sessionElapsedMs, snap.beat, snap.progress);
    if (!commit) {
      return;
    }
    if (snap.finished) {
      void this.finish();
      return;
    }
    this.voiceNow(true);
  }

  private voiceNow(force: boolean): void {
    if (!this.voiceOn() || !this.breath || this.paused() || (this.scrubbing && !force)) {
      return;
    }
    const snap = this.breath.snapshot();
    if (snap.finished) {
      return;
    }
    if (!this.guided) {
      if (snap.phase !== 'inhale' && snap.phase !== 'exhale') {
        return;
      }
      if (!force && snap.phase === this.spokenPhase) {
        return;
      }
      this.spokenPhase = snap.phase;
      this.cues.speak(snap.phase);
      return;
    }
    const speech = guidedSpeech(snap.phase, snap.progress, snap.beat);
    if (!speech) {
      return;
    }
    if (!force && speech.key === this.spokenKey) {
      return;
    }
    this.spokenKey = speech.key;
    this.cues.speakText(speech.text);
  }
}

function phaseLabel(phase: BreathPhaseName, guided: boolean): string {
  if (!guided) {
    return phase === 'exhale' ? '吐氣' : '吸氣';
  }
  if (phase === 'hold') {
    return '屏息';
  }
  if (phase === 'exhale') {
    return '吐氣';
  }
  if (phase === 'inhale') {
    return '吸氣';
  }
  return '';
}

function countLabel(phase: BreathPhaseName, beat: number, remainingMs: number, guided: boolean): string {
  if (guided) {
    if (phase === 'intro' || phase === 'close') {
      return '';
    }
    return String(Math.max(1, beat));
  }
  return `${Math.max(1, Math.ceil(remainingMs / 1000))} 秒`;
}

function formatClock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
