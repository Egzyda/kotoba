// なぞり書き画面（ベース実装）。
// いまは描画・けす・つぎ まで。簡易採点（SPEC 4章）は今後ここに追加する。
import { Mascot } from '../components/mascot';
import { currentCharacter, pick } from '../data/characters';
import { findKana, getList, kataToHira, type Group, type Script } from '../data/kana';
import { h, screenHeader } from '../lib/dom';
import { addStar } from '../lib/storage';
import { go, replace, type Screen } from '../router';

const FONT = '"M PLUS Rounded 1c", sans-serif';

export const traceScreen: Screen = (root, params) => {
  const script = (params.get('script') as Script) || 'hira';
  const group = (params.get('group') as Group) || 'seion';
  const kana = findKana(script, params.get('char') ?? '') ?? getList(script, group)[0];
  const list = getList(script, kana.group);
  const index = list.findIndex((k) => k.char === kana.char);

  const chara = currentCharacter();
  const mascot = new Mascot(chara, { size: 'small', bubble: 'right' });
  const canvas = h('canvas', { class: 'trace-canvas' });
  const ctx = canvas.getContext('2d')!;
  const strokes: { x: number; y: number }[][] = [];
  let size = 0;

  function drawGuide() {
    const len = kana.char.length;
    ctx.save();
    ctx.fillStyle = 'rgba(255, 107, 154, 0.18)';
    ctx.font = `800 ${size * (len > 1 ? 0.5 : 0.8)}px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(kana.char, size / 2, size / 2 + size * 0.03);
    ctx.restore();
  }

  function drawStrokes() {
    ctx.save();
    ctx.strokeStyle = '#ff6b9a';
    ctx.lineWidth = size * 0.05;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const s of strokes) {
      ctx.beginPath();
      s.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
      if (s.length === 1) ctx.lineTo(s[0].x + 0.1, s[0].y);
      ctx.stroke();
    }
    ctx.restore();
  }

  function redraw() {
    ctx.clearRect(0, 0, size, size);
    drawGuide();
    drawStrokes();
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    size = rect.width;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    redraw();
  }

  const pos = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  canvas.addEventListener('pointerdown', (e) => {
    canvas.setPointerCapture(e.pointerId);
    strokes.push([pos(e)]);
    redraw();
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!canvas.hasPointerCapture(e.pointerId)) return;
    strokes[strokes.length - 1].push(pos(e));
    redraw();
  });

  const clearBtn = h('button', { class: 'btn-action', text: 'けす' });
  clearBtn.addEventListener('click', () => {
    strokes.length = 0;
    redraw();
  });

  const doneBtn = h('button', { class: 'btn-action btn-primary', text: 'できた！' });
  doneBtn.addEventListener('click', () => {
    if (strokes.length === 0) {
      mascot.say(chara.lines.traceEmpty);
      return;
    }
    // TODO: SPEC 4章の簡易採点（カバー率・はみ出し率）で3段階評価にする
    addStar(kana.char);
    mascot.say(`${pick(chara.lines.praise)} ★`);
  });

  const nextBtn = h('button', { class: 'btn-action', text: 'つぎ →' });
  nextBtn.addEventListener('click', () => {
    const next = list[(index + 1) % list.length];
    replace('/trace', { script, group: kana.group, char: next.char });
  });

  // カタカナ学習時は読み方が分からないので、ここだけ小さくふりがな（よみ）を出す
  const reading =
    script === 'kata' ? h('p', { class: 'trace-reading', text: `よみ: ${kataToHira(kana.char)}` }) : null;

  const header = screenHeader('なぞる', () =>
    go('/select', { mode: 'trace', script, group: kana.group }),
  );
  if (reading) header.append(reading);

  root.append(
    h('main', { class: 'screen trace' }, [
      header,
      h('div', { class: 'trace-top' }, [mascot.el]),
      h('div', { class: 'trace-board' }, [canvas]),
      h('div', { class: 'trace-actions' }, [clearBtn, doneBtn, nextBtn]),
    ]),
  );

  const onResize = () => resize();
  window.addEventListener('resize', onResize);
  resize();
  // フォント読み込み後にガイドを描き直す
  document.fonts?.load(`800 100px ${FONT}`, kana.char).then(redraw, () => {});

  return () => {
    window.removeEventListener('resize', onResize);
    mascot.destroy();
  };
};
