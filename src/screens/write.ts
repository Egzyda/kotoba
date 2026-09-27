// えを みて かこう: ランダムな絵の単語を、1もじずつ なぞって かく（うすい見本つき）
import { TraceBoard } from '../components/board';
import { Mascot } from '../components/mascot';
import { wordPicture } from '../components/word';
import { currentCharacter, pick } from '../data/characters';
import { splitUnits, toScript, type Script } from '../data/kana';
import { QUIZ_WORDS, type Word } from '../data/words';
import { button, h, screenHeader, scriptToggle } from '../lib/dom';
import { addStar, loadPref, savePref } from '../lib/storage';
import { go, type Screen } from '../router';

export const writeScreen: Screen = (root) => {
  let script = loadPref<Script>('script', 'hira', ['hira', 'kata']);
  const chara = currentCharacter();
  const mascot = new Mascot(chara, { size: 'small', bubble: 'right' });
  const board = new TraceBoard();

  const picBox = h('div', { class: 'quiz-pic' });
  const unitsEl = h('div', { class: 'quiz-units' });
  let word: Word;
  let units: string[] = [];
  let pos = 0;
  let lastWord = '';

  const doneBtn = button('できた', { icon: 'check', class: 'btn-action btn-primary' });
  const nextBtn = button('つぎの え', { icon: 'next', iconAfter: true });

  function renderUnits() {
    unitsEl.replaceChildren(
      ...units.map((u, i) =>
        h('span', { class: `unit ${i < pos ? 'is-done' : i === pos ? 'is-current' : ''}`, text: u }),
      ),
    );
  }

  function newWord() {
    const pool = QUIZ_WORDS.filter((w) => w.word !== lastWord && splitUnits(w.word).length <= 5);
    word = pick(pool);
    lastWord = word.word;
    units = splitUnits(toScript(word.word, script));
    pos = 0;
    picBox.replaceChildren(wordPicture(word));
    renderUnits();
    board.setGuide(units[0]);
    doneBtn.classList.remove('is-hidden');
    mascot.say(chara.lines.writeHint);
  }

  doneBtn.addEventListener('click', () => {
    if (!board.hasStrokes) return mascot.say(chara.lines.traceEmpty);
    pos += 1;
    renderUnits();
    if (pos < units.length) {
      board.setGuide(units[pos]);
      mascot.say(pick(chara.lines.praise));
    } else {
      addStar(word.word);
      doneBtn.classList.add('is-hidden');
      mascot.say(chara.lines.wordDone);
    }
  });
  nextBtn.addEventListener('click', newWord);

  const toggle = scriptToggle(script, (s) => {
    script = s;
    savePref('script', s);
    units = splitUnits(toScript(word.word, script));
    renderUnits();
    board.setGuide(units[Math.min(pos, units.length - 1)]);
  });

  root.append(
    h('main', { class: 'screen write' }, [
      screenHeader('かこう', () => go('/'), [toggle]),
      h('div', { class: 'quiz-top' }, [picBox, unitsEl]),
      h('div', { class: 'mascot-row' }, [mascot.el]),
      board.el,
      h('div', { class: 'actions' }, [
        button('けす', { icon: 'eraser', onClick: () => board.clear() }),
        doneBtn,
        nextBtn,
      ]),
    ]),
  );
  newWord();

  return () => {
    board.destroy();
    mascot.destroy();
  };
};
