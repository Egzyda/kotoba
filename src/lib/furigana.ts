// ふりがなルール:
//   ユーザー（3歳児）はひらがなしか読めない前提。
//   UI に出るカタカナには原則ひらがなのふりがなを付ける。
//   ただしカタカナ学習の対象として文字そのものを見せる場面（文字表・なぞり・カード表面）では付けない。
import { kataToHira } from '../data/kana';

const KATA_RUN = /[ァ-ヺー]+/g;

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

/** テキスト中のカタカナの連なりを <ruby> でくるんだ HTML を返す（入力はエスケープされる） */
export function withFurigana(text: string): string {
  return escapeHtml(text).replace(
    KATA_RUN,
    (run) => `<ruby>${run}<rt>${kataToHira(run)}</rt></ruby>`,
  );
}

/** ふりがな付きテキストを持つ要素を作る */
export function furiganaEl<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  text: string,
  className?: string,
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  if (className) el.className = className;
  el.innerHTML = withFurigana(text);
  return el;
}
