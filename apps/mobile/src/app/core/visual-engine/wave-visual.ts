import type { BreathVisualState } from './breath-scale';
import { PixiVisual, type VisualSurface } from './surface';

export class WaveVisual extends PixiVisual {
  private shift = 0;

  protected draw(surface: VisualSurface, _state: BreathVisualState, amount: number): void {
    const { graphics, width, height } = surface;
    const amplitude = amount * height * 0.16;
    this.shift += 0.035;
    graphics.clear();
    graphics.moveTo(0, height / 2);
    for (let x = 0; x <= width; x += 8) {
      graphics.lineTo(x, height / 2 + Math.sin(x * 0.018 + this.shift) * amplitude);
    }
    graphics.stroke({ color: this.color, alpha: 0.9, width: 1.5 });
  }
}
