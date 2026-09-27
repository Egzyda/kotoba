// 文字えらび画面: ひらがな/カタカナ × グループのタブと、1画面に収まる文字表。
// 行の頭の ▶ で「その ぎょうだけ」を順番に練習できる。
import { GROUPS, getRows, type Group, type Script } from '../data/kana';
import { h, screenHeader, scriptToggle } from '../lib/dom';
import { withFurigana } from '../lib/furigana';
import { icon } from '../lib/icons';
import { loadPref, loadProgress, savePref } from '../lib/storage';
import { go, type Screen } from '../router';

export const selectScreen: Screen = (root, params) => {
  const mode = params.get('mode') === 'cards' ? 'cards' : 'trace';
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
        const rowBtn = h('button', { class: 'row-start', 'aria-label': 'この ぎょう' }, [
          icon('play', { size: 18, fill: 'currentColor' }),
        ]);
        rowBtn.addEventListener('click', () =>
          go(`/${mode}`, { script, group, row: String(r), char: row.find((k) => k)!.char }),
        );
        return [
          rowBtn,
          ...row.map((k) => {
            if (!k) return h('div', { class: 'kana-cell is-empty' });
            const cell = h('button', { class: 'kana-cell' }, [h('span', { text: k.char })]);
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

  const title = mode === 'trace' ? 'なぞる' : 'カード';
  root.append(
    h('main', { class: 'screen select' }, [
      screenHeader(withFurigana(title), () => go('/')),
      toggle,
      groupTabs,
      h('div', { class: 'grid-wrap' }, [grid]),
    ]),
  );
  renderAll();
};
