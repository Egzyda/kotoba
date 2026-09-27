// なぞり書き画面。row があれば その ぎょうだけを順番に進める。
// 「できた」→ ほめる → ボタンが「つぎ」に かわる。「まえ」で ひとつ まえの もじへ。
import { TraceBoard } from '../components/board';
import { Mascot } from '../components/mascot';
import { currentCharacter, pick } from '../data/characters';
import { findKana, getList, getRowList, kataToHira, type Group, type Script } from '../data/kana';
import { button, h, screenHeader } from '../lib/dom';
import { addStar } from '../lib/storage';
import { go, replace, type Screen } from '../router';

export const traceScreen: Screen = (root, params) => {
  const script: Script = params.get('script') === 'kata' ? 'kata' : 'hira';
  const group = (params.get('group') as Group) || 'seion';
  const rowParam = params.get('row');
  const kana = findKana(script, params.get('char') ?? '') ?? getList(script, group)[0];
  const list = rowParam !== null ? getRowList(script, kana.group, Number(rowParam)) : getList(script, kana.group);
  const index = Math.max(0, list.findIndex((k) => k.char === kana.char));
  // ひとまわり したら おわり（さいごの もじの あとは「おわり」）
  const isLast = index === list.length - 1;

  const chara = currentCharacter();
  const mascot = new Mascot(chara, { size: 'small', bubble: 'right' });
  const board = new TraceBoard();
  board.setGuide(kana.char);

  const toSelect = () => go('/select', { mode: 'trace', script, group: kana.group });
  const moveTo = (i: number) =>
    replace('/trace', {
      script,
      group: kana.group,
      char: list[(i + list.length) % list.length].char,
      ...(rowParam !== null ? { row: rowParam } : {}),
    });

  let done = false;
  const mainBtn = button('できた', { icon: 'check', class: 'btn-action btn-primary' });
  const setMain = (label: string, iconName: 'check' | 'next') => {
    mainBtn.replaceChildren(...button(label, { icon: iconName, iconAfter: iconName === 'next' }).childNodes);
  };
  mainBtn.addEventListener('click', () => {
    if (done) return isLast ? toSelect() : moveTo(index + 1);
    if (!board.hasStrokes) return mascot.say(chara.lines.traceEmpty);
    done = true;
    addStar(kana.char);
    if (isLast) {
      mascot.say(pick(chara.lines.praise), ...(rowParam !== null ? [chara.lines.rowDone] : []));
      setMain('おわり', 'check');
    } else {
      mascot.say(pick(chara.lines.praise));
      setMain('つぎ', 'next');
    }
    mainBtn.classList.add('is-next');
  });

  const prevBtn = button('まえ', { icon: 'prev', onClick: () => moveTo(index - 1) });
  prevBtn.disabled = index === 0;

  const actions = h('div', { class: 'actions' }, [
    prevBtn,
    button('けす', { icon: 'eraser', onClick: () => board.clear() }),
    mainBtn,
  ]);

  // カタカナ学習時は読み方が分からないので、ここだけ小さく よみ を出す
  const extra = script === 'kata' ? [h('p', { class: 'reading', text: `よみ: ${kataToHira(kana.char)}` })] : [];

  // ぎょう練習のときは すすみぐあいを てんで表示
  const dots =
    rowParam !== null
      ? h(
          'div',
          { class: 'dots' },
          list.map((_, i) => h('span', { class: `dot ${i < index ? 'is-done' : i === index ? 'is-current' : ''}` })),
        )
      : null;

  root.append(
    h('main', { class: 'screen trace' }, [
      screenHeader('なぞる', toSelect, extra),
      h('div', { class: 'mascot-row' }, [mascot.el]),
      ...(dots ? [dots] : []),
      board.el,
      actions,
    ]),
  );

  mascot.say(chara.lines.traceEmpty);

  return () => {
    board.destroy();
    mascot.destroy();
  };
};
