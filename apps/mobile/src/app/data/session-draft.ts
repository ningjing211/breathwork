import { Injectable } from '@angular/core';
import type { SessionPreset, UserSessionConfig } from '@app/contracts';

@Injectable({ providedIn: 'root' })
export class SessionDraft {
  private config: UserSessionConfig | null = null;

  get(): UserSessionConfig | null {
    return this.config;
  }

  startFromPreset(preset: SessionPreset): void {
    this.config = {
      presetId: preset.id,
      musicTrackId: preset.musicTrack.id,
      visualPreset: preset.visualPreset,
      affirmations: preset.affirmations.map((item) => ({ ...item })),
    };
  }

  update(patch: Partial<Omit<UserSessionConfig, 'presetId'>>): void {
    if (!this.config) {
      return;
    }
    this.config = { ...this.config, ...patch };
  }

  clear(): void {
    this.config = null;
  }
}
