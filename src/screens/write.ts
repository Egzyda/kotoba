// えを みて かこう: 絵の単語を、1もじずつ なぞって かく（うすい見本・かきじゅんつき）
// ランダム モード と、文字えらびで えらんだ文字から じゅんばんに出す モード がある。
// 「できた」→ ほめる → ボタンが「つぎの もじ」に。さいごの もじの あとだけ「つぎの え」になる。
import { TraceBoard } from '../components/board';
import { Mascot } from '../components/mascot';
import { wordPicture } from '../components/word';
import { currentCharacter, pick } from '../data/characters';
import { splitUnits, toScript, type Script } from '../data/kana';
import { QUIZ_WORDS, type Word } from '../data/words';
import { button, h, screenHeader, scriptToggle } from '../lib/dom';
import type { IconName } from '../lib/icons';
import { isLastInRun, parseRun, runParams } from '../lib/sequence';
import { play } from '../lib/sfx';
import { speakChar, speakWord } from '../lib/speech';
import { addStar, loadPref, savePref } from '../lib/storage';
import { go, replace, type Screen } from '../router';

type State = 'writing' | 'charDone' | 'wordDone';

export const writeScreen: Screen = (root, params) => {
  const run = parseRun(params);
  let script = run?.script ?? loadPref<Script>('script', 'hira', ['hira', 'kata']);
  const toSelect = () =>
    go('/select', { mode: 'write', script, ...(run ? { group: run.group } : {}) });
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
    if (pos > 0) speakChar(units[pos]);
    setMain('できた', 'check');
    prevBtn.disabled = pos === 0;
  }

  function newWord() {
    if (run) {
      word = run.word;
    } else {
      const pool = QUIZ_WORDS.filter((w) => w.word !== lastWord && splitUnits(w.word).length <= 5);
      word = pick(pool);
    }
    lastWord = word.word;
    units = splitUnits(toScript(word.word, script));
    picBox.replaceChildren(wordPicture(word));
    showUnit(0);
    mascot.say(chara.lines.writeHint);
    // たんご → さいしょの もじ の じゅんに よむ
    const w = word.word;
    window.setTimeout(() => {
      speakWord(w);
      speakChar(units[0], true);
    }, 350);
  }

  mainBtn.addEventListener('click', () => {
    if (state === 'charDone') return showUnit(pos + 1);
    if (state === 'wordDone') {
      if (!run) return newWord();
      if (isLastInRun(run)) return toSelect();
      return replace('/write', runParams(run, run.index + 1));
    }
    if (!board.hasStrokes) return mascot.say(chara.lines.traceEmpty);
    if (pos < units.length - 1) {
      state = 'charDone';
      renderUnits();
      play('correct');
      mascot.say(pick(chara.lines.praise));
      setMain('つぎの もじ', 'next', true);
    } else {
      state = 'wordDone';
      renderUnits();
      addStar(word.word);
      play('fanfare');
      speakWord(word.word);
      mascot.say(chara.lines.wordDone);
      if (run && isLastInRun(run)) setMain('おわり', 'check');
      else setMain('つぎの え', 'next', true);
    }
    prevBtn.disabled = false;
  });

  board.onListen = () => speakChar(units[pos]);
  picBox.addEventListener('click', () => speakWord(word.word));

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
      screenHeader('かこう', toSelect, run ? [] : [toggle]),
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
