// たんごカード画面（ベース実装）。
// 表: 文字 / 裏: 絵＋単語。単語・絵データは今後 src/data に追加する。
import { Mascot } from '../components/mascot';
import { findKana, getList, type Group, type Script } from '../data/kana';
import { h, screenHeader } from '../lib/dom';
import { withFurigana } from '../lib/furigana';
import { go, replace, type Screen } from '../router';

export const cardsScreen: Screen = (root, params) => {
  const script = (params.get('script') as Script) || 'hira';
  const group = (params.get('group') as Group) || 'seion';
  const kana = findKana(script, params.get('char') ?? '') ?? getList(script, group)[0];
  const list = getList(script, kana.group);
  const index = list.findIndex((k) => k.char === kana.char);

  const mascot = new Mascot({ size: 'small', bubble: 'right' });

  // 表面はカタカナ学習の対象なのでふりがな無し。裏面の単語は必要に応じて付ける。
  const card = h('button', { class: 'flashcard', 'aria-label': 'かーど' }, [
    h('div', { class: 'flashcard-face flashcard-front' }, [
      h('span', { class: 'flashcard-char', text: kana.char }),
    ]),
    h('div', { class: 'flashcard-face flashcard-back' }, [
      h('div', { class: 'flashcard-image', text: 'え' }),
      h('p', { class: 'flashcard-word', html: withFurigana('じゅんびちゅう') }),
    ]),
  ]);
  card.addEventListener('click', () => card.classList.toggle('is-flipped'));

  const move = (d: number) => {
    const next = list[(index + d + list.length) % list.length];
    replace('/cards', { script, group: kana.group, char: next.char });
  };
  const prevBtn = h('button', { class: 'btn-action', text: '← まえ' });
  prevBtn.addEventListener('click', () => move(-1));
  const nextBtn = h('button', { class: 'btn-action', text: 'つぎ →' });
  nextBtn.addEventListener('click', () => move(1));

  root.append(
    h('main', { class: 'screen cards' }, [
      screenHeader(withFurigana('たんごカード'), () =>
        go('/select', { mode: 'cards', script, group: kana.group }),
      ),
      h('div', { class: 'cards-top' }, [mascot.el]),
      h('div', { class: 'cards-stage' }, [card]),
      h('div', { class: 'trace-actions' }, [prevBtn, nextBtn]),
    ]),
  );
  mascot.say('タッチで めくってね');

  return () => mascot.destroy();
};
