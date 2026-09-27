import { APP } from '../config';
import { Mascot } from '../components/mascot';
import { currentCharacter } from '../data/characters';
import { button, h } from '../lib/dom';
import { withFurigana } from '../lib/furigana';
import { icon, type IconName } from '../lib/icons';
import { loadProgress } from '../lib/storage';
import { updateToLatest } from '../lib/update';
import { go, type Screen } from '../router';

const MODES: { label: string; icon: IconName; cls: string; to: () => void }[] = [
  { label: 'なぞる', icon: 'trace', cls: 'mode-trace', to: () => go('/select', { mode: 'trace' }) },
  { label: 'カード', icon: 'cards', cls: 'mode-cards', to: () => go('/select', { mode: 'cards' }) },
  { label: 'かこう', icon: 'write', cls: 'mode-write', to: () => go('/select', { mode: 'write' }) },
  { label: 'ならべる', icon: 'order', cls: 'mode-order', to: () => go('/select', { mode: 'order' }) },
];

export const homeScreen: Screen = (root) => {
  const progress = loadProgress();
  const chara = currentCharacter();
  const mascot = new Mascot(chara, { size: 'large' });

  const modeButtons = MODES.map((m) => {
    const b = h('button', { class: `btn-mode ${m.cls}` }, [
      icon(m.icon, { size: 36 }),
      h('span', { class: 'btn-mode-label', html: withFurigana(m.label) }),
    ]);
    b.addEventListener('click', m.to);
    return b;
  });

  const charaBtn = button('かえる', { icon: 'chara', class: 'btn-small', onClick: () => go('/chara') });

  const updateBtn = button('さいしんに する', { icon: 'update', class: 'btn-small' });
  let busy = false;
  updateBtn.addEventListener('click', async () => {
    if (busy) return;
    busy = true;
    updateBtn.classList.add('is-busy');
    const result = await updateToLatest();
    if (result === 'reloading') return;
    busy = false;
    updateBtn.classList.remove('is-busy');
    mascot.say(result === 'latest' ? chara.lines.updateLatest : chara.lines.updateOffline);
  });

  root.append(
    h('main', { class: 'screen home' }, [
      h('header', { class: 'home-header' }, [
        h('h1', { class: 'home-title', html: withFurigana(APP.name) }),
        h('div', { class: 'star-count', 'aria-label': `すたー ${progress.stars}` }, [
          icon('star', { size: 22, fill: 'currentColor' }),
          h('span', { text: String(progress.stars) }),
        ]),
      ]),
      h('section', { class: 'home-mascot' }, [mascot.el]),
      h('nav', { class: 'home-menu' }, modeButtons),
      h('footer', { class: 'home-footer' }, [
        charaBtn,
        h('small', { class: 'app-version', text: `v${__APP_VERSION__}` }),
        updateBtn,
      ]),
    ]),
  );

  mascot.talkLoop(chara.lines.home);
  return () => mascot.destroy();
};
