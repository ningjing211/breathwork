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
import { BreathEngine } from '../../core/breath-engine/breath-engine';
import { BreathCueSpeaker } from '../../core/speech/breath-cue-speaker';
import { createVisualRenderer } from '../../core/visual-engine/create-visual';
import type { VisualRenderer } from '../../core/visual-engine/surface';
import { getPreset, getTrack } from '../../data/session-catalog';
import { SessionDraft } from '../../data/session-draft';

const PRESET_COLOR: Record<string, number> = {
  start: 0xd7a15f,
  trust: 0xe6d3a3,
  ease: 0x7f9c98,
  sleep: 0x9a8aa8,
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
  private durationMs = 180_000;
  private spokenPhase: 'inhale' | 'exhale' | null = null;
  private enabledLines: string[] = [];
  private leaving = false;
  private exited = false;

  protected readonly title = signal('');
  protected readonly phaseLabel = signal('吸氣');
  protected readonly seconds = signal(4);
  protected readonly line = signal('');
  protected readonly opacity = signal(0);
  protected readonly progress = signal(0);
  protected readonly paused = signal(false);
  protected readonly failed = signal(false);

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
    this.seconds.set(preset.breathPattern.inhaleDuration);
    this.enabledLines = config.affirmations
      .filter((item) => item.enabled && item.text.trim())
      .map((item) => item.text);
    this.breath = new BreathEngine(preset.breathPattern, preset.duration);
    this.visual = createVisualRenderer(
      config.visualPreset,
      PRESET_COLOR[preset.id] ?? PRESET_COLOR['start'],
    );

    afterNextRender(() => {
      void this.mount(track.file);
    });
  }

  protected toggle(): void {
    if (!this.breath || this.leaving || this.failed()) {
      return;
    }
    if (this.paused()) {
      this.breath.resume();
      this.audio.resume();
      this.paused.set(false);
      this.zone.runOutsideAngular(() => this.tick());
      return;
    }
    this.breath.pause();
    this.audio.pause();
    this.cues.stop();
    cancelAnimationFrame(this.frame);
    this.paused.set(true);
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

  private async mount(file: string): Promise<void> {
    const element = this.host()?.nativeElement;
    if (!this.breath || !this.visual || !element || this.exited) {
      return;
    }
    try {
      await this.visual.mount(element);
      if (this.audio.status !== 'playing') {
        await this.audio.load(file);
        await this.audio.play();
      }
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

  private tick = (): void => {
    if (this.leaving || !this.breath) {
      return;
    }
    const snap = this.breath.snapshot();
    this.visual?.render({ phase: snap.phase, progress: snap.progress });
    if (!snap.finished && snap.phase !== this.spokenPhase) {
      this.spokenPhase = snap.phase;
      this.cues.speak(snap.phase);
    }
    this.zone.run(() => this.apply(snap.phase, snap.phaseRemainingMs, snap.sessionElapsedMs));
    if (snap.finished) {
      this.zone.run(() => {
        void this.finish();
      });
      return;
    }
    this.frame = requestAnimationFrame(this.tick);
  };

  private apply(phase: 'inhale' | 'exhale', phaseRemainingMs: number, elapsedMs: number): void {
    this.phaseLabel.set(phase === 'inhale' ? '吸氣' : '吐氣');
    this.seconds.set(Math.max(1, Math.ceil(phaseRemainingMs / 1000)));
    this.progress.set((elapsedMs / this.durationMs) * 100);
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
}
