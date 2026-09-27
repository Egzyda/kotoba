// たんごカード画面。表: 文字 / 裏: 絵＋単語（その文字をハイライト）
import { Mascot } from '../components/mascot';
import { wordPicture, wordWithHighlight } from '../components/word';
import { currentCharacter } from '../data/characters';
import { findKana, getList, getRowList, kataToHira, toScript, type Group, type Script } from '../data/kana';
import { WORDS } from '../data/words';
import { button, h, screenHeader } from '../lib/dom';
import { withFurigana } from '../lib/furigana';
import { go, replace, type Screen } from '../router';

export const cardsScreen: Screen = (root, params) => {
  const script: Script = params.get('script') === 'kata' ? 'kata' : 'hira';
  const group = (params.get('group') as Group) || 'seion';
  const rowParam = params.get('row');
  const kana = findKana(script, params.get('char') ?? '') ?? getList(script, group)[0];
  const list = rowParam !== null ? getRowList(script, kana.group, Number(rowParam)) : getList(script, kana.group);
  const index = Math.max(0, list.findIndex((k) => k.char === kana.char));

  const chara = currentCharacter();
  const mascot = new Mascot(chara, { size: 'small', bubble: 'right' });
  const word = WORDS[kataToHira(kana.char)] ?? null;

  // 表面はカタカナ学習の対象なのでふりがな無し
  const back = h('div', { class: 'flashcard-face flashcard-back' });
  if (word) {
    const text = toScript(word.word, script);
    back.append(wordPicture(word, 'flashcard-pic'));
    const wordEl = h('p', { class: 'flashcard-word' }, [wordWithHighlight(text, kana.char)]);
    back.append(wordEl);
    // カタカナのときは読めないので、下に小さく ひらがな で よみ を出す
    if (script === 'kata') back.append(h('p', { class: 'reading', text: word.word }));
  } else {
    back.append(h('p', { class: 'flashcard-none', text: kana.char }));
  }

  const card = h('button', { class: 'flashcard', 'aria-label': 'かーど' }, [
    h('div', { class: 'flashcard-face flashcard-front' }, [
      h('span', { class: `flashcard-char ${kana.char.length > 1 ? 'is-wide' : ''}`, text: kana.char }),
    ]),
    back,
  ]);
  card.addEventListener('click', () => {
    card.classList.toggle('is-flipped');
    if (card.classList.contains('is-flipped') && !word) mascot.say(chara.lines.noWord);
  });

  const move = (d: number) => {
    const next = list[(index + d + list.length) % list.length];
    replace('/cards', {
      script,
      group: kana.group,
      char: next.char,
      ...(rowParam !== null ? { row: rowParam } : {}),
    });
  };

  root.append(
    h('main', { class: 'screen cards' }, [
      screenHeader(withFurigana('カード'), () => go('/select', { mode: 'cards', script, group: kana.group })),
      h('div', { class: 'mascot-row' }, [mascot.el]),
      h('div', { class: 'cards-stage' }, [card]),
      h('div', { class: 'actions' }, [
        button('まえ', { icon: 'prev', onClick: () => move(-1) }),
        button('つぎ', { icon: 'next', iconAfter: true, onClick: () => move(1) }),
      ]),
    ]),
  );
  mascot.say(chara.lines.cardsHint);

  return () => mascot.destroy();
};
