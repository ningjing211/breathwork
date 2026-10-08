import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { SessionDraft } from '../../data/session-draft';

const CLOSING: Record<string, string> = {
  start: '你已經開始了。',
  trust: '你站在自己這一邊。',
  ease: '這一口氣，先放在這裡。',
  sleep: '可以休息了。',
  four78: '呼吸回到自己的節奏。',
};

@Component({
  selector: 'mobile-completion',
  host: { class: 'ion-page' },
  templateUrl: './completion.html',
})
export class Completion {
  private readonly router = inject(Router);
  private readonly draft = inject(SessionDraft);
  protected readonly line = signal('');

  constructor() {
    const config = this.draft.get();
    const line = config ? CLOSING[config.presetId] : undefined;
    if (!line) {
      void this.router.navigateByUrl('/');
      return;
    }
    this.line.set(line);
  }

  protected home(): void {
    this.draft.clear();
    void this.router.navigateByUrl('/');
  }
}
