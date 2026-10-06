import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const sampleRate = 22050;
const duration = 6;
const length = sampleRate * duration;
const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'apps', 'mobile', 'public', 'audio');

function render(partials) {
  const samples = new Float32Array(length);
  let peak = 0;
  for (let i = 0; i < length; i += 1) {
    const t = i / sampleRate;
    let value = 0;
    for (const partial of partials) {
      const tremolo = partial.tremolo
        ? 0.82 + 0.18 * Math.sin(2 * Math.PI * partial.tremolo * t)
        : 1;
      value += Math.sin(2 * Math.PI * partial.freq * t) * partial.amp * tremolo;
    }
    samples[i] = value;
    peak = Math.max(peak, Math.abs(value));
  }
  const gain = peak > 0 ? 0.65 / peak : 0;
  return Float32Array.from(samples, (sample) => sample * gain);
}

function wav(samples) {
  const dataSize = samples.length * 2;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);
  for (let i = 0; i < samples.length; i += 1) {
    const sample = Math.max(-1, Math.min(1, samples[i]));
    buffer.writeInt16LE(Math.round(sample * 32767), 44 + i * 2);
  }
  return buffer;
}

const tracks = {
  'ambient.wav': [
    { freq: 110, amp: 0.45, tremolo: 0.5 },
    { freq: 165, amp: 0.22, tremolo: 0.5 },
    { freq: 220, amp: 0.16, tremolo: 1 },
  ],
  'organic.wav': [
    { freq: 98, amp: 0.4, tremolo: 1 },
    { freq: 146, amp: 0.28, tremolo: 0.5 },
    { freq: 196, amp: 0.18, tremolo: 1.5 },
  ],
  'deep.wav': [
    { freq: 49, amp: 0.7, tremolo: 0.5 },
    { freq: 73, amp: 0.28, tremolo: 0.5 },
    { freq: 98, amp: 0.12, tremolo: 0.5 },
  ],
};

mkdirSync(root, { recursive: true });
for (const [name, partials] of Object.entries(tracks)) {
  const file = join(root, name);
  writeFileSync(file, wav(render(partials)));
  console.log(file);
}
