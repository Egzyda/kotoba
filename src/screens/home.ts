import { MASCOT } from '../config';
import { Mascot } from '../components/mascot';
import { h } from '../lib/dom';
import { withFurigana } from '../lib/furigana';
import { loadProgress } from '../lib/storage';
import { updateToLatest } from '../lib/update';
import { go, type Screen } from '../router';

export const homeScreen: Screen = (root) => {
  const progress = loadProgress();
  const mascot = new Mascot({ size: 'large' });

  const traceBtn = h('button', { class: 'btn-big btn-trace' }, [
    h('span', { class: 'btn-icon', text: '✏️' }),
    h('span', { class: 'btn-label', text: 'なぞる' }),
  ]);
  traceBtn.addEventListener('click', () => go('/select', { mode: 'trace' }));

  const cardsBtn = h('button', { class: 'btn-big btn-cards' }, [
    h('span', { class: 'btn-icon', text: '🃏' }),
    h('span', { class: 'btn-label', html: withFurigana('たんごカード') }),
  ]);
  cardsBtn.addEventListener('click', () => go('/select', { mode: 'cards' }));

  const updateBtn = h('button', { class: 'btn-update', text: '🔄 さいしんに する' });
  let busy = false;
  updateBtn.addEventListener('click', async () => {
    if (busy) return;
    busy = true;
    updateBtn.textContent = '⏳ しらべてるよ…';
    const result = await updateToLatest();
    if (result === 'reloading') {
      updateBtn.textContent = '⏳ あたらしく してるよ…';
      return;
    }
    busy = false;
    updateBtn.textContent = '🔄 さいしんに する';
    mascot.say(
      result === 'latest' ? 'もう さいしんだよ！' : 'いまは つながらないみたい',
    );
  });

  root.append(
    h('main', { class: 'screen home' }, [
      h('header', { class: 'home-header' }, [
        h('h1', { class: 'home-title', text: 'ことば' }),
        h('div', { class: 'star-count', 'aria-label': `すたー ${progress.stars}` }, [
          h('span', { class: 'star', text: '★' }),
          h('span', { text: String(progress.stars) }),
        ]),
      ]),
      h('section', { class: 'home-mascot' }, [mascot.el]),
      h('nav', { class: 'home-menu' }, [traceBtn, cardsBtn]),
      h('footer', { class: 'home-footer' }, [
        updateBtn,
        h('small', { class: 'app-version', text: `v${__APP_VERSION__}` }),
      ]),
    ]),
  );

  mascot.startChatter(MASCOT.homeLines);
  return () => mascot.destroy();
};
