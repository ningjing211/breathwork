import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home').then((m) => m.Home),
  },
  {
    path: 'session/:presetId/customize',
    loadComponent: () => import('./features/customize/customize').then((m) => m.Customize),
  },
  {
    path: 'session/play',
    loadComponent: () => import('./features/player/player').then((m) => m.Player),
  },
  {
    path: 'session/complete',
    loadComponent: () => import('./features/completion/completion').then((m) => m.Completion),
  },
  { path: '**', redirectTo: '' },
];
