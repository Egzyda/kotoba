// 文字セット選択画面: ひらがな/カタカナ × グループのタブと、文字表グリッド
import { GROUPS, getRows, type Group, type Script } from '../data/kana';
import { h, screenHeader } from '../lib/dom';
import { withFurigana } from '../lib/furigana';
import { loadProgress } from '../lib/storage';
import { go, type Screen } from '../router';

const SCRIPTS: { id: Script; label: string }[] = [
  { id: 'hira', label: 'ひらがな' },
  { id: 'kata', label: 'カタカナ' },
];

export const selectScreen: Screen = (root, params) => {
  const mode = params.get('mode') === 'cards' ? 'cards' : 'trace';
  let script = (params.get('script') as Script) || 'hira';
  let group = (params.get('group') as Group) || 'seion';
  const progress = loadProgress();

  const scriptTabs = h('div', { class: 'tabs tabs-script', role: 'tablist' });
  const groupTabs = h('div', { class: 'tabs tabs-group', role: 'tablist' });
  const grid = h('div', { class: 'kana-grid' });

  const syncUrl = () =>
    history.replaceState(null, '', `#/select?${new URLSearchParams({ mode, script, group })}`);

  function renderTabs() {
    scriptTabs.replaceChildren(
      ...SCRIPTS.map((s) => {
        // タブ名はナビゲーション用なのでカタカナにもふりがなを付ける
        const b = h('button', {
          class: `tab ${s.id === script ? 'is-active' : ''}`,
          role: 'tab',
          html: withFurigana(s.label),
        });
        b.addEventListener('click', () => {
          script = s.id;
          syncUrl();
          renderAll();
        });
        return b;
      }),
    );
    groupTabs.replaceChildren(
      ...GROUPS.map((g) => {
        const b = h('button', {
          class: `tab tab-small ${g.id === group ? 'is-active' : ''}`,
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
    grid.className = `kana-grid ${group === 'youon' ? 'cols-3' : 'cols-5'}`;
    // カタカナ学習中の文字表そのものにはふりがなを付けない（文字が学習対象のため）
    grid.replaceChildren(
      ...rows.flat().map((k) => {
        if (!k) return h('div', { class: 'kana-cell is-empty' });
        const stars = progress.perChar[k.char] ?? 0;
        const cell = h('button', { class: 'kana-cell', text: k.char });
        if (stars > 0) cell.append(h('span', { class: 'cell-star', text: '★' }));
        cell.addEventListener('click', () =>
          go(`/${mode}`, { script, group, char: k.char }),
        );
        return cell;
      }),
    );
  }

  function renderAll() {
    renderTabs();
    renderGrid();
  }

  const title = mode === 'trace' ? 'なぞる' : 'たんごカード';
  root.append(
    h('main', { class: 'screen select' }, [
      screenHeader(withFurigana(title), () => go('/')),
      scriptTabs,
      groupTabs,
      grid,
    ]),
  );
  renderAll();
};
