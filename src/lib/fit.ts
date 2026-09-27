// セリフなどの文字を「変な位置で改行しない」「入らなければ縮める」ためのヘルパー。
// - スペースや 。！？ で区切った「まとまり」ごとに改行禁止の span にする
// - 行数が maxLines を超える / まとまりが幅からはみ出すときは font-size を下げる
import { withFurigana } from './furigana';

/** テキストを改行禁止のまとまり（.ph）に分けた HTML にする。カタカナにはふりがな */
export function phraseHtml(text: string): string {
  return text
    .split(/(?<=[。！？、…]) *| +/)
    .filter((p) => p.length > 0)
    .map((p) => `<span class="ph">${withFurigana(p)}</span>`)
    .join(' ');
}

export interface FitOptions {
  maxLines?: number;
  maxPx?: number;
  minPx?: number;
}

/** el 内の .ph が maxLines 行に収まるまで文字を小さくする */
export function fitText(el: HTMLElement, opts: FitOptions = {}): void {
  const { maxLines = 2, minPx = 11 } = opts;
  const maxPx = opts.maxPx ?? (parseFloat(el.dataset.fitMax ?? '') || parseFloat(getComputedStyle(el).fontSize));
  el.dataset.fitMax = String(maxPx);
  const phrases = [...el.querySelectorAll<HTMLElement>('.ph')];
  if (phrases.length === 0 || el.clientWidth === 0) return;

  for (let px = maxPx; px >= minPx; px -= 1) {
    el.style.fontSize = `${px}px`;
    const width = el.clientWidth - parseFloat(getComputedStyle(el).paddingLeft) - parseFloat(getComputedStyle(el).paddingRight);
    const tops = new Set(phrases.map((p) => Math.round(p.offsetTop / 4)));
    const tooWide = phrases.some((p) => p.offsetWidth > width + 0.5);
    if (tops.size <= maxLines && !tooWide) return;
  }
}

/** phraseHtml を入れて fitText する */
export function setFittedText(el: HTMLElement, text: string, opts?: FitOptions): void {
  el.innerHTML = phraseHtml(text);
  fitText(el, opts);
}
