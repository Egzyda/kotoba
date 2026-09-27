// 文字・単語の よみあげ（端末の よみあげ機能 = Web Speech API）。
// - こえ は端末まかせ（iPhone なら Kyoko など）。アクセントは直せない
// - 1文字だけ読むときは カタカナにして読ませる（ひらがな1文字だと「は」を「わ」と読むことがあるため）
// - iPhone は さいしょの よみあげを タップの中で ひらく必要があるので unlockSpeech() を最初のタップで呼ぶ
import { hiraToKata } from '../data/kana';
import { speechText, type Word } from '../data/words';
import { loadPref, savePref } from './storage';

const synth: SpeechSynthesis | undefined = typeof speechSynthesis !== 'undefined' ? speechSynthesis : undefined;
let voice: SpeechSynthesisVoice | null = null;
let enabled = loadPref<'on' | 'off'>('voice', 'on', ['on', 'off']) === 'on';

function pickVoice(): void {
  const ja = synth?.getVoices().filter((v) => v.lang.replace('_', '-').toLowerCase().startsWith('ja')) ?? [];
  // なるべく ききやすい こえ を えらぶ
  const prefer = ['Kyoko', 'O-ren', 'Google 日本語', 'Nanami', 'Haruka'];
  voice = prefer.map((name) => ja.find((v) => v.name.includes(name))).find(Boolean) ?? ja[0] ?? null;
}
pickVoice();
synth?.addEventListener?.('voiceschanged', pickVoice);

export function voiceEnabled(): boolean {
  return enabled && !!synth;
}

export function setVoiceEnabled(on: boolean): void {
  enabled = on;
  savePref('voice', on ? 'on' : 'off');
  if (!on) synth?.cancel();
}

/** 1文字（きゃ などの 1マスぶん）の よみかた */
function charReading(unit: string): string {
  if (unit === 'ー' || unit === 'っ' || unit === 'ッ') return '';
  return hiraToKata(unit);
}

function say(text: string, queue = false): void {
  if (!voiceEnabled() || !text.trim()) return;
  if (!queue) synth!.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'ja-JP';
  if (voice) u.voice = voice;
  u.rate = 0.8;
  u.pitch = 1.15;
  synth!.speak(u);
}

/** 文字を よむ（例: あ / きゃ） */
export function speakChar(unit: string, queue = false): void {
  say(charReading(unit), queue);
}

/** 単語を よむ（例: きりん / ほんを よむ）。漢字・カタカナの かきかたで よませる */
export function speakWord(word: Word, queue = false): void {
  say(speechText(word), queue);
}

/** そのまま よむ */
export function speakText(text: string): void {
  say(text);
}

/** がめんを ひらいた ちょっと あとに よむ（がめんが かわったら とりけし） */
export function speakSoon(fn: () => void, ms = 350): () => void {
  const t = window.setTimeout(fn, ms);
  return () => window.clearTimeout(t);
}

export function stopSpeech(): void {
  synth?.cancel();
}

/** さいしょのタップで よみあげを つかえるようにする（iPhone 対策） */
export function unlockSpeech(): void {
  if (!synth) return;
  const u = new SpeechSynthesisUtterance(' ');
  u.volume = 0;
  synth.speak(u);
}
