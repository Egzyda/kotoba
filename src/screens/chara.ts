// あんないキャラ えらび画面
import { framePortrait } from '../components/mascot';
import { CHARACTERS } from '../data/characters';
import { h, screenHeader } from '../lib/dom';
import { withFurigana } from '../lib/furigana';
import { loadCharacterId, saveCharacterId } from '../lib/storage';
import { go, type Screen } from '../router';
import { Mascot } from '../components/mascot';

export const charaScreen: Screen = (root) => {
  const firstTime = loadCharacterId() === null;
  const stage = h('div', { class: 'chara-stage' });
  let mascot: Mascot | undefined;
  let leaveTimer: number | undefined;

  const cards = CHARACTERS.map((c) => {
    const portrait = h('div', { class: 'chara-portrait is-empty' });
    const card = h('button', { class: 'chara-card' }, [
      portrait,
      h('span', { class: 'chara-name', text: c.name }),
      h('span', { class: 'chara-cure', html: withFurigana(c.cureName) }),
    ]);
    card.style.setProperty('--chara', c.color);
    card.addEventListener('click', () => {
      saveCharacterId(c.id);
      cards.forEach((x) => x.classList.toggle('is-selected', x === card));
      mascot?.destroy();
      mascot = new Mascot(c, { size: 'small', bubble: 'right' });
      stage.replaceChildren(mascot.el);
      mascot.say(c.lines.greet, 0);
      window.clearTimeout(leaveTimer);
      leaveTimer = window.setTimeout(() => go('/'), 1800);
    });
    requestAnimationFrame(() =>
      framePortrait(portrait, import.meta.env.BASE_URL + c.image, c.face, 'small'),
    );
    return card;
  });

  const current = loadCharacterId();
  cards.forEach((card, i) => card.classList.toggle('is-selected', CHARACTERS[i].id === current));

  const header = firstTime
    ? h('header', { class: 'screen-header' }, [
        h('h1', { class: 'screen-title', text: 'だれと あそぶ？' }),
      ])
    : screenHeader('だれと あそぶ？', () => go('/'));

  root.append(
    h('main', { class: 'screen chara' }, [
      header,
      h('div', { class: 'chara-grid' }, cards),
      stage,
    ]),
  );

  return () => {
    window.clearTimeout(leaveTimer);
    mascot?.destroy();
  };
};
