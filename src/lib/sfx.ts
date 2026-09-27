// こうかおん。音声ファイルは つかわず Web Audio で その場で 作る（オリジナルの おと）。
import { loadPref, savePref } from './storage';

export type Sfx = 'correct' | 'star' | 'fanfare' | 'wrong' | 'flip' | 'tap';

let ctx: AudioContext | null = null;
let enabled = loadPref<'on' | 'off'>('sfx', 'on', ['on', 'off']) === 'on';

export function sfxEnabled(): boolean {
  return enabled;
}

export function setSfxEnabled(on: boolean): void {
  enabled = on;
  savePref('sfx', on ? 'on' : 'off');
}

/** さいしょのタップで おとを ならせるようにする（スマホは タップするまで おとが でない） */
export function unlockSfx(): void {
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return;
  ctx ??= new AC();
  if (ctx.state === 'suspended') void ctx.resume();
}

/** ひとつの おと（音程 freq Hz を start 秒後から dur 秒） */
function tone(freq: number, start: number, dur: number, opts: { type?: OscillatorType; vol?: number; slideTo?: number } = {}) {
  if (!ctx) return;
  const t0 = ctx.currentTime + start;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = opts.type ?? 'sine';
  osc.frequency.setValueAtTime(freq, t0);
  if (opts.slideTo) osc.frequency.exponentialRampToValueAtTime(opts.slideTo, t0 + dur);
  const vol = opts.vol ?? 0.18;
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

const NOTE = { C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99, A5: 880, C6: 1046.5, E6: 1318.5, G6: 1568 };

export function play(name: Sfx): void {
  if (!enabled || !ctx) return;
  switch (name) {
    case 'tap': // ぽっ
      tone(900, 0, 0.06, { vol: 0.06, slideTo: 600 });
      break;
    case 'correct': // ピンポン
      tone(NOTE.E6, 0, 0.18, { type: 'triangle' });
      tone(NOTE.C6, 0.12, 0.3, { type: 'triangle' });
      break;
    case 'star': // キラキラ
      [NOTE.C6, NOTE.E6, NOTE.G6, NOTE.E6 * 2].forEach((f, i) => tone(f, i * 0.07, 0.25, { vol: 0.1 }));
      break;
    case 'fanfare': // できた！ の ファンファーレ
      [NOTE.C5, NOTE.E5, NOTE.G5].forEach((f, i) => tone(f, i * 0.11, 0.18, { type: 'triangle' }));
      tone(NOTE.C6, 0.36, 0.5, { type: 'triangle', vol: 0.2 });
      tone(NOTE.E6, 0.36, 0.5, { vol: 0.08 });
      tone(NOTE.G6, 0.5, 0.4, { vol: 0.06 });
      break;
    case 'wrong': // ぽよん
      tone(330, 0, 0.25, { type: 'sine', slideTo: 200, vol: 0.2 });
      break;
    case 'flip': // しゅっ
      tone(500, 0, 0.12, { type: 'triangle', slideTo: 1200, vol: 0.08 });
      break;
  }
}
