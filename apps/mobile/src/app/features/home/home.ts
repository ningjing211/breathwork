import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonContent } from '@ionic/angular';
import { SESSION_PRESETS, formatDuration } from '../../data/session-catalog';

@Component({
  selector: 'mobile-home',
  imports: [IonContent, RouterLink],
  host: { class: 'ion-page' },
  templateUrl: './home.html',
})
export class Home {
  protected readonly presets = SESSION_PRESETS;
  protected readonly formatDuration = formatDuration;
}
