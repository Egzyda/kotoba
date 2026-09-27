// こうかおん と BGM。音声ファイルは つかわず Web Audio で その場で 作る（オリジナルの おと）。
// iPhone 対策:
// - タップするまで おとが でないので、さいしょのタップで AudioContext を ひらく（unlockAudio）
// - マナーモードでも ならせるように navigator.audioSession.type = 'playback' にする（iOS 17 以降）
import { loadPref, savePref } from './storage';

export type Sfx = 'correct' | 'star' | 'fanfare' | 'wrong' | 'flip' | 'tap';

let ctx: AudioContext | null = null;
let sfxBus: GainNode | null = null;
let bgmBus: GainNode | null = null;
let sfxOn = loadPref<'on' | 'off'>('sfx', 'on', ['on', 'off']) === 'on';
let bgmOn = loadPref<'on' | 'off'>('bgm', 'on', ['on', 'off']) === 'on';

const SFX_VOLUME = 0.9;
const BGM_VOLUME = 0.35; // こうかおんより ずっと ちいさく（音符ごとの音量も小さい）
const BGM_DUCK = 0.35; // よみあげ中は さらに さげる

export function sfxEnabled(): boolean {
  return sfxOn;
}

export function setSfxEnabled(on: boolean): void {
  sfxOn = on;
  savePref('sfx', on ? 'on' : 'off');
}

export function bgmEnabled(): boolean {
  return bgmOn;
}

export function setBgmEnabled(on: boolean): void {
  bgmOn = on;
  savePref('bgm', on ? 'on' : 'off');
  if (on) startBgm();
  else stopBgm();
}

/** さいしょのタップ（と その後のタップ）で おとを ならせるようにする */
export function unlockAudio(): void {
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return;
  const session = (navigator as unknown as { audioSession?: { type: string } }).audioSession;
  if (session && session.type !== 'playback') session.type = 'playback';
  if (!ctx) {
    ctx = new AC();
    sfxBus = ctx.createGain();
    sfxBus.gain.value = SFX_VOLUME;
    sfxBus.connect(ctx.destination);
    bgmBus = ctx.createGain();
    bgmBus.gain.value = BGM_VOLUME;
    bgmBus.connect(ctx.destination);
    // むおんを 1かい ならして ひらく（ふるい iPhone 対策）
    const src = ctx.createBufferSource();
    src.buffer = ctx.createBuffer(1, 1, 22050);
    src.connect(ctx.destination);
    src.start(0);
  }
  if (ctx.state !== 'running') void ctx.resume();
  if (bgmOn) startBgm();
}

// アプリが うらに いったら とめる
document.addEventListener('visibilitychange', () => {
  if (!ctx) return;
  if (document.hidden) void ctx.suspend();
  else void ctx.resume();
});

/** ひとつの おと（音程 freq Hz を start 秒後から dur 秒） */
function tone(
  freq: number,
  start: number,
  dur: number,
  opts: { type?: OscillatorType; vol?: number; slideTo?: number; bus?: GainNode | null; at?: number } = {},
) {
  if (!ctx) return;
  const t0 = (opts.at ?? ctx.currentTime) + start;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = opts.type ?? 'sine';
  osc.frequency.setValueAtTime(freq, t0);
  if (opts.slideTo) osc.frequency.exponentialRampToValueAtTime(opts.slideTo, t0 + dur);
  const vol = opts.vol ?? 0.18;
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain).connect(opts.bus ?? sfxBus ?? ctx.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

const NOTE = { C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99, A5: 880, C6: 1046.5, E6: 1318.5, G6: 1568 };

export function play(name: Sfx): void {
  if (!sfxOn || !ctx) return;
  switch (name) {
    case 'tap': // ぽこっ
      tone(700, 0, 0.08, { type: 'triangle', vol: 0.12, slideTo: 1100 });
      break;
    case 'correct': // ピンポン
      tone(NOTE.E6, 0, 0.18, { type: 'triangle' });
      tone(NOTE.C6, 0.12, 0.3, { type: 'triangle' });
      break;
    case 'star': // キラキラ
      [NOTE.C6, NOTE.E6, NOTE.G6, NOTE.E6 * 2].forEach((f, i) => tone(f, i * 0.07, 0.25, { vol: 0.12 }));
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
      tone(500, 0, 0.12, { type: 'triangle', slideTo: 1200, vol: 0.1 });
      break;
  }
}

// ---------- BGM: オルゴールふうの オリジナル曲（8小節を くりかえし） ----------
const BPM = 92;
const BEAT = 60 / BPM;
const midi = (n: number) => 440 * 2 ** ((n - 69) / 12);
// [音（MIDI番号, null=休み）, 拍数]
const MELODY: [number | null, number][] = [
  [76, 1], [79, 1], [81, 1], [79, 1],
  [76, 1], [74, 1], [72, 2],
  [74, 1], [76, 1], [79, 1], [76, 1],
  [74, 3], [null, 1],
  [77, 1], [81, 1], [84, 1], [81, 1],
  [79, 1], [76, 1], [72, 2],
  [74, 1], [76, 1], [79, 1], [74, 1],
  [72, 3], [null, 1],
];
const BASS = [48, 43, 45, 43, 41, 48, 43, 48]; // 1小節ずつ
const LOOP_BEATS = MELODY.reduce((a, [, b]) => a + b, 0);

let bgmTimer: number | undefined;
let loopStart = 0;
let scheduledUntil = 0; // 拍（ループ開始からの通し）

function scheduleBgm(): void {
  if (!ctx || !bgmBus) return;
  const now = ctx.currentTime;
  const horizon = now + 0.6;
  while (loopStart + scheduledUntil * BEAT < horizon) {
    const loopIndex = Math.floor(scheduledUntil / LOOP_BEATS);
    const base = loopStart + loopIndex * LOOP_BEATS * BEAT;
    // この ループ ぶんを まとめて よやく
    let beat = 0;
    for (const [note, len] of MELODY) {
      if (note !== null) {
        const t = base + beat * BEAT;
        tone(midi(note), 0, len * BEAT * 0.95, { at: t, vol: 0.09, bus: bgmBus });
        tone(midi(note + 12), 0, 0.25, { at: t, vol: 0.02, bus: bgmBus }); // キラっと オルゴールの ひびき
      }
      beat += len;
    }
    BASS.forEach((n, bar) => {
      tone(midi(n), 0, 4 * BEAT * 0.9, { at: base + bar * 4 * BEAT, vol: 0.05, type: 'triangle', bus: bgmBus });
    });
    scheduledUntil = (loopIndex + 1) * LOOP_BEATS;
  }
}

export function startBgm(): void {
  if (!ctx || !bgmOn || bgmTimer !== undefined) return;
  loopStart = ctx.currentTime + 0.1;
  scheduledUntil = 0;
  scheduleBgm();
  bgmTimer = window.setInterval(scheduleBgm, 250);
  bgmBus?.gain.setTargetAtTime(BGM_VOLUME, ctx.currentTime, 0.1);
}

export function stopBgm(): void {
  window.clearInterval(bgmTimer);
  bgmTimer = undefined;
  if (!ctx || !bgmBus) return;
  // よやく ずみの おとは フェードアウトで けす
  const g = bgmBus;
  g.gain.setTargetAtTime(0, ctx.currentTime, 0.05);
  const old = g;
  bgmBus = ctx.createGain();
  bgmBus.gain.value = BGM_VOLUME;
  bgmBus.connect(ctx.destination);
  window.setTimeout(() => old.disconnect(), 400);
}

/** よみあげ中は BGM を ちいさく */
export function duckBgm(on: boolean): void {
  if (!ctx || !bgmBus) return;
  bgmBus.gain.setTargetAtTime(on ? BGM_VOLUME * BGM_DUCK : BGM_VOLUME, ctx.currentTime, 0.08);
}
