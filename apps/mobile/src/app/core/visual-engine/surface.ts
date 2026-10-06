import { Application, Graphics } from 'pixi.js';
import { breathAmount, type BreathVisualState } from './breath-scale';

export interface VisualSurface {
  app: Application;
  graphics: Graphics;
  width: number;
  height: number;
  destroy(): void;
}

export async function mountSurface(host: HTMLElement): Promise<VisualSurface> {
  const app = new Application();
  await app.init({
    backgroundAlpha: 0,
    antialias: true,
    autoStart: false,
    autoDensity: true,
    resolution: Math.min(globalThis.devicePixelRatio || 1, 2),
    preference: 'webgl',
    width: Math.max(1, host.clientWidth),
    height: Math.max(1, host.clientHeight),
  });
  host.appendChild(app.canvas);
  const graphics = new Graphics();
  app.stage.addChild(graphics);

  const surface: VisualSurface = {
    app,
    graphics,
    width: Math.max(1, host.clientWidth),
    height: Math.max(1, host.clientHeight),
    destroy: () => undefined,
  };

  const resize = () => {
    surface.width = Math.max(1, host.clientWidth);
    surface.height = Math.max(1, host.clientHeight);
    app.renderer.resize(surface.width, surface.height);
  };
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  resize();

  surface.destroy = () => {
    observer.disconnect();
    app.destroy({ removeView: true }, { children: true, texture: true, context: true });
  };

  return surface;
}

export function paint(surface: VisualSurface): void {
  surface.app.renderer.render(surface.app.stage);
}

export interface VisualRenderer {
  mount(host: HTMLElement): Promise<void>;
  render(state: BreathVisualState): void;
  destroy(): void;
}

export abstract class PixiVisual implements VisualRenderer {
  protected surface: VisualSurface | null = null;

  constructor(protected readonly color: number) {}

  async mount(host: HTMLElement): Promise<void> {
    this.surface = await mountSurface(host);
  }

  render(state: BreathVisualState): void {
    if (!this.surface) {
      return;
    }
    this.draw(this.surface, state, breathAmount(state));
    paint(this.surface);
  }

  destroy(): void {
    this.surface?.destroy();
    this.surface = null;
  }

  protected abstract draw(surface: VisualSurface, state: BreathVisualState, amount: number): void;
}
