// 文字えらび画面: ひらがな/カタカナ × グループのタブと、1画面に収まる文字表。
// 行の頭の ▶ で「その ぎょうだけ」を順番に練習できる。
// かこう / ならべる では、えらんだ文字から じゅんばんに 単語を出す。「ランダム」で ばらばらに出す。
import { GROUPS, getRows, type Group, type Script } from '../data/kana';
import { wordFor } from '../data/words';
import { button, h, screenHeader, scriptToggle } from '../lib/dom';
import { withFurigana } from '../lib/furigana';
import { icon } from '../lib/icons';
import { loadPref, loadProgress, savePref } from '../lib/storage';
import { go, type Screen } from '../router';

export const selectScreen: Screen = (root, params) => {
  const MODES = { trace: 'なぞる', cards: 'カード', write: 'かこう', order: 'ならべる' } as const;
  type Mode = keyof typeof MODES;
  const mode: Mode = (params.get('mode') as Mode) in MODES ? (params.get('mode') as Mode) : 'trace';
  // かこう・ならべる は 単語が ある 文字だけ えらべる
  const needsWord = mode === 'write' || mode === 'order';
  const playable = (char: string) => !needsWord || wordFor(char) !== null;
  let script = (params.get('script') as Script | null) ?? loadPref<Script>('script', 'hira', ['hira', 'kata']);
  let group = (GROUPS.find((g) => g.id === params.get('group'))?.id ?? 'seion') as Group;
  const progress = loadProgress();

  const groupTabs = h('div', { class: 'tabs', role: 'tablist' });
  const grid = h('div', { class: 'kana-grid' });

  const syncUrl = () =>
    history.replaceState(null, '', `#/select?${new URLSearchParams({ mode, script, group })}`);

  function renderGroupTabs() {
    groupTabs.replaceChildren(
      ...GROUPS.map((g) => {
        const b = h('button', {
          class: `tab ${g.id === group ? 'is-active' : ''}`,
          role: 'tab',
          text: g.label,
        });
        b.addEventListener('click', () => {
          group = g.id;
          syncUrl();
          renderAll();
        });
        return b;
      }),
    );
  }

  function renderGrid() {
    const rows = getRows(script, group);
    const cols = rows[0].length;
    grid.style.setProperty('--rows', String(rows.length));
    grid.style.setProperty('--cols', String(cols));
    // カタカナ学習中の文字表そのものにはふりがなを付けない（文字が学習対象のため）
    grid.replaceChildren(
      ...rows.flatMap((row, r) => {
        const first = row.find((k) => k && playable(k.char));
        const rowBtn = h('button', { class: 'row-start', 'aria-label': 'この ぎょう' }, [
          icon('play', { size: 18, fill: 'currentColor' }),
        ]);
        rowBtn.disabled = !first;
        rowBtn.addEventListener('click', () => {
          if (first) go(`/${mode}`, { script, group, row: String(r), char: first.char });
        });
        return [
          rowBtn,
          ...row.map((k) => {
            if (!k) return h('div', { class: 'kana-cell is-empty' });
            const cell = h('button', { class: 'kana-cell' }, [h('span', { text: k.char })]);
            cell.disabled = !playable(k.char);
            if ((progress.perChar[k.char] ?? 0) > 0) {
              cell.append(h('span', { class: 'cell-star' }, [icon('star', { size: 12, fill: 'currentColor' })]));
            }
            cell.addEventListener('click', () => go(`/${mode}`, { script, group, char: k.char }));
            return cell;
          }),
        ];
      }),
    );
  }

  function renderAll() {
    renderGroupTabs();
    renderGrid();
  }

  const toggle = scriptToggle(script, (s) => {
    script = s;
    savePref('script', s);
    syncUrl();
    renderGrid();
  });

  // かこう・ならべる は「ランダム」でも あそべる
  const randomBtn = needsWord
    ? [button('ランダム', { icon: 'random', class: 'btn-small btn-random', onClick: () => go(`/${mode}`, { script }) })]
    : [];

  root.append(
    h('main', { class: 'screen select' }, [
      screenHeader(withFurigana(MODES[mode]), () => go('/'), randomBtn),
      toggle,
      groupTabs,
      h('div', { class: 'grid-wrap' }, [grid]),
    ]),
  );
  renderAll();
};
