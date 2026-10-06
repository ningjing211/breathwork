import type { BreathVisualState } from './breath-scale';
import { PixiVisual, type VisualSurface } from './surface';

interface Particle {
  x: number;
  y: number;
  size: number;
  phase: number;
}

export class ParticlesVisual extends PixiVisual {
  private readonly particles: Particle[] = Array.from({ length: 28 }, (_, index) => ({
    x: ((index * 47) % 100) / 100,
    y: ((index * 29) % 100) / 100,
    size: 1.4 + (index % 5) * 0.45,
    phase: index * 0.7,
  }));
  private time = 0;

  protected draw(surface: VisualSurface, _state: BreathVisualState, amount: number): void {
    const { graphics, width, height } = surface;
    this.time += 0.02;
    graphics.clear();
    for (const particle of this.particles) {
      const drift = Math.sin(this.time + particle.phase) * 10;
      graphics.circle(
        particle.x * width,
        particle.y * height + drift,
        particle.size * amount * 2.2,
      );
    }
    graphics.fill({ color: this.color, alpha: 0.82 });
  }
}
