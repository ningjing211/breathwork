import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = join(process.cwd(), 'apps/web/src');
const banned = ['@ionic/', '@capacitor/', 'pixi.js', 'tone'];

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      return sourceFiles(path);
    }
    return /\.(ts|html|scss|css)$/.test(name) ? [path] : [];
  });
}

describe('web boundary', () => {
  it('does not import Ionic, Capacitor, Pixi, or Tone', () => {
    const offenders = sourceFiles(root).flatMap((path) => {
      const text = readFileSync(path, 'utf8');
      return banned.filter((token) => text.includes(token)).map((token) => `${path} ${token}`);
    });
    expect(offenders).toEqual([]);
  });
});
