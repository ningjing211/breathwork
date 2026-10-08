import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import type { VisualPreset } from '@app/contracts';
import { IonContent } from '@ionic/angular';
import { formatDuration, getPreset, getTrack, MUSIC_TRACKS } from '../../data/session-catalog';
import { SessionDraft } from '../../data/session-draft';

const MAX_AFFIRMATIONS = 8;

@Component({
  selector: 'mobile-customize',
  imports: [IonContent],
  host: { class: 'ion-page' },
  templateUrl: './customize.html',
})
export class Customize {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly draft = inject(SessionDraft);

  protected readonly tracks = MUSIC_TRACKS;
  protected readonly visuals: readonly { id: VisualPreset; label: string }[] = [
    { id: 'orb', label: '光球' },
    { id: 'wave', label: '波' },
    { id: 'particles', label: '粒子' },
  ];
  protected readonly title = signal('');
  protected readonly durationLabel = signal('');
  protected readonly musicTrackId = signal('ambient');
  protected readonly visualPreset = signal<VisualPreset>('orb');
  protected readonly affirmations = signal<{ id: string; text: string; enabled: boolean }[]>([]);
  protected readonly editingId = signal<string | null>(null);
  protected readonly busy = signal(false);
  protected readonly hint = signal('');
  protected readonly canStart = computed(() =>
    this.affirmations().some((item) => item.enabled && item.text.trim().length > 0),
  );
  protected readonly missing = signal(false);

  constructor() {
    const preset = getPreset(this.route.snapshot.paramMap.get('presetId') ?? '');
    if (!preset) {
      this.missing.set(true);
      void this.router.navigateByUrl('/');
      return;
    }
    const existing = this.draft.get();
    if (!existing || existing.presetId !== preset.id) {
      this.draft.startFromPreset(preset);
    }
    const config = this.draft.get();
    if (!config) {
      return;
    }
    this.title.set(preset.title);
    this.durationLabel.set(formatDuration(preset.duration));
    this.musicTrackId.set(config.musicTrackId);
    this.visualPreset.set(config.visualPreset);
    this.affirmations.set(config.affirmations.map((item) => ({ ...item })));
  }

  protected pickMusic(id: string): void {
    this.musicTrackId.set(id);
    this.persist();
  }

  protected pickVisual(id: VisualPreset): void {
    this.visualPreset.set(id);
    this.persist();
  }

  protected toggle(id: string): void {
    this.affirmations.update((list) =>
      list.map((item) => (item.id === id ? { ...item, enabled: !item.enabled } : item)),
    );
    this.hint.set('');
    this.persist();
  }

  protected edit(id: string): void {
    this.editingId.set(id);
    setTimeout(() => document.querySelector<HTMLInputElement>('.sentence-input')?.focus());
  }

  protected commit(id: string, event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) {
      return;
    }
    const text = target.value.trim();
    this.editingId.set(null);
    if (!text) {
      this.affirmations.update((list) => {
        const current = list.find((item) => item.id === id);
        if (!current || current.text.trim() === '') {
          return list.filter((item) => item.id !== id);
        }
        return list;
      });
    } else {
      this.affirmations.update((list) =>
        list.map((item) => (item.id === id ? { ...item, text } : item)),
      );
    }
    this.persist();
  }

  protected add(): void {
    if (this.affirmations().length >= MAX_AFFIRMATIONS) {
      return;
    }
    const id = crypto.randomUUID();
    this.affirmations.update((list) => [...list, { id, text: '', enabled: true }]);
    this.persist();
    this.edit(id);
  }

  protected begin(): void {
    if (this.busy()) {
      return;
    }
    if (!this.canStart()) {
      this.hint.set('請至少留下一句');
      return;
    }
    const track = getTrack(this.musicTrackId());
    if (!track) {
      this.hint.set('音樂載入失敗，請再試一次');
      return;
    }
    this.busy.set(true);
    this.hint.set('');
    void this.router.navigateByUrl('/session/play').catch(() => {
      this.busy.set(false);
    });
  }

  private persist(): void {
    this.draft.update({
      musicTrackId: this.musicTrackId(),
      visualPreset: this.visualPreset(),
      affirmations: this.affirmations().map((item) => ({ ...item })),
    });
  }
}
