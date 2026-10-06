import type { BreathVisualState } from './breath-scale';
import { PixiVisual, type VisualSurface } from './surface';

export class OrbVisual extends PixiVisual {
  protected draw(surface: VisualSurface, _state: BreathVisualState, amount: number): void {
    const { graphics, width, height } = surface;
    const radius = Math.min(width, height) * 0.22 * amount;
    graphics.clear();
    graphics.circle(width / 2, height / 2, radius).fill({ color: this.color, alpha: 0.92 });
    graphics
      .circle(width / 2, height / 2, radius + 16)
      .stroke({ color: this.color, alpha: 0.4, width: 1 });
  }
}
