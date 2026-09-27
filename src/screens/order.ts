// ならべよう: 絵を見て、ばらばらの もじを じゅんばんに えらぶ。
// ランダム モード と、文字えらびで えらんだ文字から じゅんばんに出す モード がある。
// レベル1: ダミーなし / 2: ダミー2まい / 3: かたちが にている もじを まぜる
import { Mascot } from '../components/mascot';
import { wordPicture } from '../components/word';
import { currentCharacter, pick } from '../data/characters';
import { getList, splitUnits, toScript, type Script } from '../data/kana';
import { lookAlikes } from '../data/lookalike';
import { QUIZ_WORDS, type Word } from '../data/words';
import { button, h, screenHeader, scriptToggle, shuffle } from '../lib/dom';
import { icon } from '../lib/icons';
import { isLastInRun, parseRun, runParams } from '../lib/sequence';
import { play } from '../lib/sfx';
import { speakChar, speakWord } from '../lib/speech';
import { addStar, loadPref, savePref } from '../lib/storage';
import { go, replace, type Screen } from '../router';

type Level = '1' | '2' | '3';

function makeDummies(units: string[], script: Script, level: Level): string[] {
  if (level === '1') return [];
  const used = new Set(units);
  const randomPool = shuffle(getList(script, 'seion').map((k) => k.char)).filter((c) => !used.has(c));
  const dummies: string[] = [];
  if (level === '3') {
    for (const c of shuffle(units.flatMap((u) => lookAlikes(u)))) {
      if (dummies.length >= 2) break;
      if (!used.has(c) && !dummies.includes(c)) dummies.push(c);
    }
  }
  const total = level === '2' ? 2 : 3;
  for (const c of randomPool) {
    if (dummies.length >= total) break;
    if (!dummies.includes(c)) dummies.push(c);
  }
  return dummies;
}

export const orderScreen: Screen = (root, params) => {
  const run = parseRun(params);
  let script = run?.script ?? loadPref<Script>('script', 'hira', ['hira', 'kata']);
  const toSelect = () =>
    go('/select', { mode: 'order', script, ...(run ? { group: run.group } : {}) });
  let level = loadPref<Level>('orderLevel', '1', ['1', '2', '3']);
  const chara = currentCharacter();
  const mascot = new Mascot(chara, { size: 'small', bubble: 'right' });

  const picBox = h('div', { class: 'order-pic' });
  const slotsEl = h('div', { class: 'order-slots' });
  const tilesEl = h('div', { class: 'order-tiles' });
  const nextBtn = button('つぎの え', { icon: 'next', iconAfter: true, class: 'btn-action btn-primary' });
  let word: Word;
  let units: string[] = [];
  let pos = 0;
  let lastWord = '';

  function renderSlots() {
    slotsEl.classList.toggle('is-long', units.length >= 6);
    slotsEl.replaceChildren(
      ...units.map((u, i) => h('span', { class: `slot ${i < pos ? 'is-filled' : ''}`, text: i < pos ? u : '' })),
    );
  }

  function setupRound() {
    units = splitUnits(toScript(word.word, script));
    pos = 0;
    renderSlots();
    const tiles = shuffle([...units, ...makeDummies(units, script, level)]);
    tilesEl.style.setProperty('--cols', String(Math.max(4, Math.ceil(tiles.length / 2))));
    tilesEl.replaceChildren(
      ...tiles.map((t) => {
        const b = h('button', { class: 'tile', text: t, 'data-sfx': 'none' });
        b.addEventListener('click', () => tap(b, t));
        return b;
      }),
    );
    nextBtn.classList.add('is-hidden');
  }

  function newWord() {
    if (run) {
      word = run.word;
    } else {
      const pool = QUIZ_WORDS.filter((w) => {
        const n = splitUnits(w.word).length;
        return w.word !== lastWord && n >= 2 && n <= 5;
      });
      word = pick(pool);
    }
    lastWord = word.word;
    picBox.replaceChildren(wordPicture(word));
    setupRound();
    mascot.say(chara.lines.orderHint);
    const w = word;
    window.setTimeout(() => speakWord(w), 350);
  }

  function tap(tile: HTMLButtonElement, text: string) {
    if (pos >= units.length) return;
    if (text !== units[pos]) {
      tile.classList.remove('is-shake');
      void tile.offsetWidth;
      tile.classList.add('is-shake');
      play('wrong');
      mascot.say(chara.lines.orderWrong);
      return;
    }
    tile.disabled = true;
    tile.classList.add('is-used');
    pos += 1;
    renderSlots();
    // さいごの もじは 単語だけ よむ（「ぬ いぬ」と つづけて よまない）
    if (pos < units.length) {
      speakChar(text);
      play('correct');
    }
    if (pos === units.length) {
      addStar(word.word);
      play('fanfare');
      speakWord(word);
      mascot.say(chara.lines.wordDone);
      nextBtn.classList.remove('is-hidden');
    }
  }

  if (run && isLastInRun(run)) nextBtn.replaceChildren(...button('おわり', { icon: 'check' }).childNodes);
  picBox.addEventListener('click', () => speakWord(word));
  nextBtn.addEventListener('click', () => {
    if (!run) return newWord();
    if (isLastInRun(run)) return toSelect();
    replace('/order', runParams(run, run.index + 1));
  });

  const levelEl = h('div', { class: 'segmented level' });
  const renderLevel = () =>
    levelEl.replaceChildren(
      ...(['1', '2', '3'] as Level[]).map((lv) => {
        const b = h(
          'button',
          { class: `seg ${lv === level ? 'is-active' : ''}`, 'aria-label': `れべる ${lv}` },
          Array.from({ length: Number(lv) }, () => icon('star', { size: 14, fill: 'currentColor' })),
        );
        b.addEventListener('click', () => {
          level = lv;
          savePref('orderLevel', lv);
          renderLevel();
          setupRound();
        });
        return b;
      }),
    );
  renderLevel();

  const toggle = scriptToggle(script, (s) => {
    script = s;
    savePref('script', s);
    setupRound();
  });

  root.append(
    h('main', { class: 'screen order' }, [
      screenHeader('ならべる', toSelect),
      h('div', { class: 'options' }, run ? [levelEl] : [toggle, levelEl]),
      picBox,
      slotsEl,
      h('div', { class: 'mascot-row' }, [mascot.el]),
      tilesEl,
      h('div', { class: 'actions' }, [nextBtn]),
    ]),
  );
  newWord();

  return () => mascot.destroy();
};
