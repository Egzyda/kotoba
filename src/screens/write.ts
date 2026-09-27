// えを みて かこう: ランダムな絵の単語を、1もじずつ なぞって かく（うすい見本・かきじゅんつき）
// 「できた」→ ほめる → ボタンが「つぎの もじ」に。さいごの もじの あとだけ「つぎの え」になる。
import { TraceBoard } from '../components/board';
import { Mascot } from '../components/mascot';
import { wordPicture } from '../components/word';
import { currentCharacter, pick } from '../data/characters';
import { splitUnits, toScript, type Script } from '../data/kana';
import { QUIZ_WORDS, type Word } from '../data/words';
import { button, h, screenHeader, scriptToggle } from '../lib/dom';
import type { IconName } from '../lib/icons';
import { addStar, loadPref, savePref } from '../lib/storage';
import { go, type Screen } from '../router';

type State = 'writing' | 'charDone' | 'wordDone';

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
  let state: State = 'writing';
  let lastWord = '';

  const mainBtn = h('button', { class: 'btn-action btn-primary' });
  const prevBtn = button('まえ', { icon: 'prev' });

  function setMain(label: string, iconName: IconName, after = false) {
    mainBtn.replaceChildren(...button(label, { icon: iconName, iconAfter: after }).childNodes);
    mainBtn.classList.toggle('is-next', state !== 'writing');
  }

  function renderUnits() {
    unitsEl.replaceChildren(
      ...units.map((u, i) =>
        h('span', { class: `unit ${i < pos || state === 'wordDone' ? 'is-done' : i === pos ? 'is-current' : ''}`, text: u }),
      ),
    );
  }

  function showUnit(i: number) {
    pos = i;
    state = 'writing';
    renderUnits();
    board.setGuide(units[pos]);
    setMain('できた', 'check');
    prevBtn.disabled = pos === 0;
  }

  function newWord() {
    const pool = QUIZ_WORDS.filter((w) => w.word !== lastWord && splitUnits(w.word).length <= 5);
    word = pick(pool);
    lastWord = word.word;
    units = splitUnits(toScript(word.word, script));
    picBox.replaceChildren(wordPicture(word));
    showUnit(0);
    mascot.say(chara.lines.writeHint);
  }

  mainBtn.addEventListener('click', () => {
    if (state === 'charDone') return showUnit(pos + 1);
    if (state === 'wordDone') return newWord();
    if (!board.hasStrokes) return mascot.say(chara.lines.traceEmpty);
    if (pos < units.length - 1) {
      state = 'charDone';
      renderUnits();
      mascot.say(pick(chara.lines.praise));
      setMain('つぎの もじ', 'next', true);
    } else {
      state = 'wordDone';
      renderUnits();
      addStar(word.word);
      mascot.say(chara.lines.wordDone);
      setMain('つぎの え', 'next', true);
    }
    prevBtn.disabled = false;
  });

  prevBtn.addEventListener('click', () => {
    // かいている とちゅうなら ひとつ まえの もじへ。できた あとなら いまの もじを もういちど
    if (state === 'writing') showUnit(Math.max(0, pos - 1));
    else showUnit(pos);
  });

  const toggle = scriptToggle(script, (s) => {
    script = s;
    savePref('script', s);
    units = splitUnits(toScript(word.word, script));
    showUnit(0);
  });

  root.append(
    h('main', { class: 'screen write' }, [
      screenHeader('かこう', () => go('/'), [toggle]),
      h('div', { class: 'quiz-top' }, [picBox, unitsEl]),
      h('div', { class: 'mascot-row' }, [mascot.el]),
      board.el,
      h('div', { class: 'actions' }, [
        prevBtn,
        button('けす', { icon: 'eraser', onClick: () => board.clear() }),
        mainBtn,
      ]),
    ]),
  );
  newWord();

  return () => {
    board.destroy();
    mascot.destroy();
  };
};
