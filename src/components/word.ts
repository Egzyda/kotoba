// 単語の絵と、文字の表示
import { type Word, wordImage } from '../data/words';
import { h } from '../lib/dom';

export function wordPicture(word: Word, cls = 'word-pic'): HTMLElement {
  const img = h('img', { src: wordImage(word), alt: '', draggable: 'false' });
  return h('div', { class: cls }, [img]);
}

/** 単語を表示し、target を含む部分をハイライトする */
export function wordWithHighlight(text: string, target: string): HTMLElement {
  const el = h('span', { class: 'word-text' });
  const i = text.indexOf(target);
  if (i < 0) {
    el.textContent = text;
  } else {
    el.append(
      text.slice(0, i),
      h('span', { class: 'hl', text: target }),
      text.slice(i + target.length),
    );
  }
  return el;
}
