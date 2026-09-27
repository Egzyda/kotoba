// 小さな DOM ヘルパー

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

/** 共通の「もどる」ボタン付きヘッダー */
export function screenHeader(titleHtml: string, onBack: () => void): HTMLElement {
  const backBtn = h('button', { class: 'btn-back', 'aria-label': 'もどる', text: '← もどる' });
  backBtn.addEventListener('click', onBack);
  return h('header', { class: 'screen-header' }, [
    backBtn,
    h('h1', { class: 'screen-title', html: titleHtml }),
  ]);
}
