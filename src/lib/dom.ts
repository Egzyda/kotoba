// 小さな DOM ヘルパー
import type { Script } from '../data/kana';
import { withFurigana } from './furigana';
import { icon, type IconName } from './icons';

export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: { class?: string; text?: string; html?: string; [k: string]: string | undefined } = {},
  children: (Node | string)[] = [],
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined) continue;
    if (k === 'class') el.className = v;
    else if (k === 'text') el.textContent = v;
    else if (k === 'html') el.innerHTML = v;
    else el.setAttribute(k, v);
  }
  el.append(...children);
  return el;
}

/** アイコン＋ラベルのボタン（ラベルのカタカナにはふりがな） */
export function button(
  label: string,
  opts: { icon?: IconName; class?: string; onClick?: () => void; iconAfter?: boolean } = {},
): HTMLButtonElement {
  const b = h('button', { class: opts.class ?? 'btn-action' });
  const text = h('span', { class: 'btn-text', html: withFurigana(label) });
  if (opts.icon && !opts.iconAfter) b.append(icon(opts.icon));
  if (label) b.append(text);
  if (opts.icon && opts.iconAfter) b.append(icon(opts.icon));
  if (opts.onClick) b.addEventListener('click', opts.onClick);
  return b;
}

/** 共通の「もどる」ボタン付きヘッダー */
export function screenHeader(titleHtml: string, onBack: () => void, extra: Node[] = []): HTMLElement {
  const backBtn = button('もどる', { icon: 'back', class: 'btn-back', onClick: onBack });
  return h('header', { class: 'screen-header' }, [
    backBtn,
    h('h1', { class: 'screen-title', html: titleHtml }),
    ...extra,
  ]);
}

/** ひらがな / カタカナ の きりかえ */
export function scriptToggle(current: Script, onChange: (s: Script) => void): HTMLElement {
  const wrap = h('div', { class: 'segmented', role: 'tablist' });
  const items: [Script, string][] = [
    ['hira', 'ひらがな'],
    ['kata', 'カタカナ'],
  ];
  const render = (active: Script) => {
    wrap.replaceChildren(
      ...items.map(([id, label]) => {
        const b = h('button', {
          class: `seg ${id === active ? 'is-active' : ''}`,
          role: 'tab',
          html: withFurigana(label),
        });
        b.addEventListener('click', () => {
          if (id === active) return;
          render(id);
          onChange(id);
        });
        return b;
      }),
    );
  };
  render(current);
  return wrap;
}

export function shuffle<T>(list: T[]): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
