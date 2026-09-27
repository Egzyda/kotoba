// あんないキャラ えらび画面。えらぶと あいさつ → 「かいし」で ホームへ
import { framePortrait, Mascot } from '../components/mascot';
import { CHARACTERS, getCharacter } from '../data/characters';
import { button, h } from '../lib/dom';
import { withFurigana } from '../lib/furigana';
import { loadCharacterId, saveCharacterId } from '../lib/storage';
import { go, type Screen } from '../router';

export const charaScreen: Screen = (root) => {
  const stage = h('div', { class: 'chara-stage' });
  let mascot: Mascot | undefined;
  let selected = getCharacter(loadCharacterId());

  const startBtn = button('かいし', {
    icon: 'play',
    class: 'btn-action btn-primary btn-start',
    onClick: () => {
      if (!selected) return;
      saveCharacterId(selected.id);
      go('/');
    },
  });

  const observers: ResizeObserver[] = [];
  const cards = CHARACTERS.map((c) => {
    const portrait = h('div', { class: 'chara-portrait is-empty' });
    const card = h('button', { class: 'chara-card' }, [
      portrait,
      h('span', { class: 'chara-name', text: c.name }),
      h('span', { class: 'chara-cure', html: withFurigana(c.cureName) }),
    ]);
    card.style.setProperty('--chara', c.color);
    card.addEventListener('click', () => select(c.id));
    const ro = new ResizeObserver(() =>
      framePortrait(portrait, import.meta.env.BASE_URL + c.image, c.face, 'small'),
    );
    ro.observe(portrait);
    observers.push(ro);
    return card;
  });

  function select(id: string) {
    selected = getCharacter(id);
    if (!selected) return;
    cards.forEach((card, i) => card.classList.toggle('is-selected', CHARACTERS[i].id === id));
    startBtn.disabled = false;
    mascot?.destroy();
    mascot = new Mascot(selected, { size: 'small', bubble: 'right' });
    stage.replaceChildren(mascot.el);
    mascot.say(selected.lines.greet);
  }

  startBtn.disabled = !selected;
  if (selected) cards.forEach((card, i) => card.classList.toggle('is-selected', CHARACTERS[i].id === selected!.id));

  root.append(
    h('main', { class: 'screen chara' }, [
      h('header', { class: 'screen-header' }, [
        h('h1', { class: 'screen-title', text: 'だれと あそぶ？' }),
      ]),
      h('div', { class: 'chara-grid' }, cards),
      stage,
      startBtn,
    ]),
  );

  return () => {
    observers.forEach((o) => o.disconnect());
    mascot?.destroy();
  };
};
