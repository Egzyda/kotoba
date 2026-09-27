// なぞり書き画面。row があれば その ぎょうだけを順番に進める。
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
  const isLast = rowParam !== null && index === list.length - 1;

  const chara = currentCharacter();
  const mascot = new Mascot(chara, { size: 'small', bubble: 'right' });
  const board = new TraceBoard();
  board.setGuide(kana.char);

  const toSelect = () => go('/select', { mode: 'trace', script, group: kana.group });

  const nextBtn = button(isLast ? 'おわり' : 'つぎ', {
    icon: isLast ? 'check' : 'next',
    iconAfter: true,
    onClick: () => {
      if (isLast) return toSelect();
      const next = list[(index + 1) % list.length];
      replace('/trace', {
        script,
        group: kana.group,
        char: next.char,
        ...(rowParam !== null ? { row: rowParam } : {}),
      });
    },
  });

  const actions = h('div', { class: 'actions' }, [
    button('けす', { icon: 'eraser', onClick: () => board.clear() }),
    button('できた', {
      icon: 'check',
      class: 'btn-action btn-primary',
      onClick: () => {
        if (!board.hasStrokes) return mascot.say(chara.lines.traceEmpty);
        // TODO: SPEC 4章の簡易採点（カバー率・はみ出し率）で3段階評価にする
        addStar(kana.char);
        if (isLast) mascot.say(pick(chara.lines.praise), chara.lines.rowDone);
        else mascot.say(pick(chara.lines.praise));
      },
    }),
    nextBtn,
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
