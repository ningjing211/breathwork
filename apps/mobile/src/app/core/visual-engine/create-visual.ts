import type { VisualPreset } from '@app/contracts';
import { OrbVisual } from './orb-visual';
import { ParticlesVisual } from './particles-visual';
import type { VisualRenderer } from './surface';
import { WaveVisual } from './wave-visual';

export function createVisualRenderer(preset: VisualPreset, color: number): VisualRenderer {
  if (preset === 'wave') {
    return new WaveVisual(color);
  }
  if (preset === 'particles') {
    return new ParticlesVisual(color);
  }
  return new OrbVisual(color);
}
