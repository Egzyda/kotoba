// なぞり書きボード（Canvas）。
// - ガイド文字は教科書体風フォント（Klee One）でうすく描く（とめ・はね・はらいが分かる）
// - かきじゅんは KanjiVG の線データを SVG で重ね、1画ずつ順番にアニメーションする
//   （なぞりはじめると かきじゅん表示は消える。右上のボタンで もう一度 見られる）
import { h } from '../lib/dom';
import { icon } from '../lib/icons';

export const PLAY_FONT = '"Klee One Kana", "M PLUS Rounded 1c", sans-serif';
const SVG_NS = 'http://www.w3.org/2000/svg';

// KanjiVG（109×109）の線を、ガイド文字（フォント）に重なるように置くための補正値
const KVG = { box: 109, scale: 0.86, dx: -1, dy: 8 };
const GUIDE = { fontRatio: 0.8, baseline: 0.03 };
const STROKE_MS = 650;

let strokeData: Promise<Record<string, string[]>> | null = null;
function loadStrokes(): Promise<Record<string, string[]>> {
  strokeData ??= fetch(`${import.meta.env.BASE_URL}data/strokes.json`)
    .then((r) => r.json() as Promise<Record<string, string[]>>)
    .catch(() => ({}));
  return strokeData;
}

/** 文字ごとの配置（中心と、1文字ぶんの箱の大きさ） */
function layout(text: string, size: number): { char: string; cx: number; cy: number; box: number }[] {
  const chars = [...text];
  // 2文字（きゃ など）は半分の大きさで横にならべる
  const box = chars.length > 1 ? size / chars.length : size;
  const fontSize = box * GUIDE.fontRatio * (chars.length > 1 ? 1.25 : 1);
  const unit = fontSize / GUIDE.fontRatio; // フォントサイズに対応する箱
  return chars.map((char, i) => ({
    char,
    cx: size / 2 + (i - (chars.length - 1) / 2) * fontSize,
    cy: size / 2,
    box: unit,
  }));
}

export class TraceBoard {
  readonly el: HTMLElement;
  private inner: HTMLElement;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private svg: SVGSVGElement;
  private strokes: { x: number; y: number }[][] = [];
  private size = 0;
  private guide = '';
  private observer: ResizeObserver;
  /** 何かを描いたとき（なぞりはじめ）に呼ばれる */
  onDraw?: () => void;

  constructor() {
    this.canvas = h('canvas', { class: 'board-canvas' });
    this.ctx = this.canvas.getContext('2d')!;
    this.svg = document.createElementNS(SVG_NS, 'svg');
    this.svg.classList.add('board-order');
    const replay = h('button', { class: 'board-replay', 'aria-label': 'かきじゅん' }, [
      icon('again', { size: 20 }),
      h('span', { text: 'かきじゅん' }),
    ]);
    replay.addEventListener('click', () => this.playOrder());
    this.inner = h('div', { class: 'board-inner' }, [this.canvas, this.svg, replay]);
    this.el = h('div', { class: 'board' }, [this.inner]);

    const pos = (e: PointerEvent) => {
      const r = this.canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    this.canvas.addEventListener('pointerdown', (e) => {
      this.canvas.setPointerCapture(e.pointerId);
      this.hideOrder();
      this.strokes.push([pos(e)]);
      this.redraw();
      this.onDraw?.();
    });
    this.canvas.addEventListener('pointermove', (e) => {
      if (!this.canvas.hasPointerCapture(e.pointerId)) return;
      this.strokes[this.strokes.length - 1]?.push(pos(e));
      this.redraw();
    });

    // 置き場所の大きさに合わせて、はみ出さない最大の正方形にする
    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(this.el);
  }

  /** ガイド文字を変えて、かきじゅんを再生する */
  setGuide(text: string): void {
    this.guide = text;
    this.strokes = [];
    this.redraw();
    document.fonts?.load(`600 100px ${PLAY_FONT}`, text).then(() => this.redraw(), () => {});
    this.playOrder();
  }

  clear(): void {
    this.strokes = [];
    this.redraw();
  }

  get hasStrokes(): boolean {
    return this.strokes.length > 0;
  }

  /** かきじゅんアニメーション */
  async playOrder(): Promise<void> {
    const text = this.guide;
    const data = await loadStrokes();
    if (text !== this.guide || this.size === 0) return;
    this.svg.replaceChildren();
    this.svg.setAttribute('viewBox', `0 0 ${this.size} ${this.size}`);
    this.svg.classList.remove('is-hidden');

    let n = 0;
    for (const { char, cx, cy, box } of layout(text, this.size)) {
      const paths = data[char] ?? [];
      const k = (box / KVG.box) * KVG.scale;
      const g = document.createElementNS(SVG_NS, 'g');
      g.setAttribute(
        'transform',
        `translate(${cx} ${cy}) scale(${k}) translate(${-KVG.box / 2 + KVG.dx} ${-KVG.box / 2 + KVG.dy})`,
      );
      const labels = document.createElementNS(SVG_NS, 'g');
      for (const d of paths) {
        const delay = n * STROKE_MS;
        n += 1;
        const path = document.createElementNS(SVG_NS, 'path');
        path.setAttribute('d', d);
        path.setAttribute('pathLength', '1');
        path.setAttribute('stroke-width', String((this.size * 0.03) / k));
        path.style.animationDelay = `${delay}ms`;
        path.style.animationDuration = `${STROKE_MS * 0.85}ms`;
        g.append(path);
        // かきはじめの位置に ばんごう
        const m = /^[Mm]\s*([-\d.]+)[,\s]+([-\d.]+)/.exec(d);
        if (m) {
          const label = document.createElementNS(SVG_NS, 'g');
          label.classList.add('order-num');
          label.style.animationDelay = `${delay}ms`;
          label.setAttribute('transform', `translate(${m[1]} ${m[2]}) scale(${1 / k / (300 / this.size)})`);
          const c = document.createElementNS(SVG_NS, 'circle');
          c.setAttribute('r', '11');
          const t = document.createElementNS(SVG_NS, 'text');
          t.setAttribute('dy', '0.36em');
          t.textContent = String(n);
          label.append(c, t);
          labels.append(label);
        }
      }
      g.append(labels);
      this.svg.append(g);
    }
  }

  private hideOrder(): void {
    this.svg.classList.add('is-hidden');
  }

  private resize(): void {
    const size = Math.floor(Math.min(this.el.clientWidth, this.el.clientHeight));
    if (size <= 0 || size === this.size) return;
    this.size = size;
    const dpr = window.devicePixelRatio || 1;
    this.inner.style.width = `${size}px`;
    this.inner.style.height = `${size}px`;
    this.canvas.width = size * dpr;
    this.canvas.height = size * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.redraw();
    if (!this.svg.classList.contains('is-hidden')) this.playOrder();
  }

  private redraw(): void {
    const { ctx, size } = this;
    ctx.clearRect(0, 0, size, size);
    // ガイド文字
    ctx.save();
    ctx.fillStyle = 'rgba(255, 107, 154, 0.22)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const { char, cx, cy, box } of layout(this.guide, size)) {
      ctx.font = `600 ${box * GUIDE.fontRatio}px ${PLAY_FONT}`;
      ctx.fillText(char, cx, cy + box * GUIDE.baseline);
    }
    ctx.restore();
    // なぞった線
    ctx.save();
    ctx.strokeStyle = '#ff6b9a';
    ctx.lineWidth = size * 0.05;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const s of this.strokes) {
      ctx.beginPath();
      s.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
      if (s.length === 1) ctx.lineTo(s[0].x + 0.1, s[0].y);
      ctx.stroke();
    }
    ctx.restore();
  }

  destroy(): void {
    this.observer.disconnect();
  }
}
