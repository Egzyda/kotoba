// なぞり書きボード（Canvas）。
// - ガイド文字は教科書体風フォント（Klee One）でうすく描く（とめ・はね・はらいが分かる）
// - かきじゅんは KanjiVG の線データを SVG で重ね、1画ずつ順番にアニメーションする
//   （なぞりはじめると かきじゅん表示は消える。右上のボタンで もう一度 見られる）
import { h } from '../lib/dom';
import { icon } from '../lib/icons';

const SVG_NS = 'http://www.w3.org/2000/svg';

// KanjiVG（109×109）の線を、ガイド文字（フォント）に重なるように置くための補正値
const KVG = { box: 109, scale: 0.86, dx: -2, dy: 15 };
const GUIDE = { fontRatio: 0.8, baseline: 0.03 };
const STROKE_MS = 650;
// マスクにする線の太さ（KanjiVG の 109 マス基準）。フォントの線をおおえる太さにする
const MASK_WIDTH = 13;
let maskSeq = 0;

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

/** ガイド文字と かきじゅんの文字を まったく同じ位置に置くための属性 */
function glyphAttrs(cx: number, cy: number, box: number): Record<string, string | number> {
  return {
    x: cx,
    y: cy + box * GUIDE.baseline,
    'font-size': box * GUIDE.fontRatio,
    'text-anchor': 'middle',
    'dominant-baseline': 'central',
  };
}

function svgEl(tag: string, attrs: Record<string, string | number> = {}): SVGElement {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  return el;
}

export class TraceBoard {
  readonly el: HTMLElement;
  private inner: HTMLElement;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private svg: SVGSVGElement;
  private guideSvg: SVGSVGElement;
  private strokes: { x: number; y: number }[][] = [];
  private size = 0;
  private guide = '';
  private observer: ResizeObserver;
  /** 何かを描いたとき（なぞりはじめ）に呼ばれる */
  onDraw?: () => void;
  /** 左上の「きく」ボタン */
  onListen?: () => void;
  private listenBtn: HTMLButtonElement;

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
    this.listenBtn = h('button', { class: 'board-listen', 'aria-label': 'きく' }, [icon('listen', { size: 20 })]);
    this.listenBtn.addEventListener('click', () => this.onListen?.());
    this.guideSvg = document.createElementNS(SVG_NS, 'svg');
    this.guideSvg.classList.add('board-guide');
    this.inner = h('div', { class: 'board-inner' }, [this.guideSvg, this.canvas, this.svg, replay, this.listenBtn]);
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
    this.renderGuide();
    this.playOrder();
  }

  clear(): void {
    this.strokes = [];
    this.redraw();
  }

  get hasStrokes(): boolean {
    return this.strokes.length > 0;
  }

  /**
   * かきじゅんアニメーション。
   * ガイドと同じフォントの文字を青で重ね、KanjiVG の線を太い「マスク」として1画ずつのばして
   * 文字を順番にぬっていく。見えるのは フォントの形なので、うすい見本と ぴったり重なる。
   */
  async playOrder(): Promise<void> {
    const text = this.guide;
    const data = await loadStrokes();
    if (text !== this.guide || this.size === 0) return;
    const run = ++maskSeq;
    const svg = svgEl;
    this.svg.replaceChildren();
    this.svg.setAttribute('viewBox', `0 0 ${this.size} ${this.size}`);
    this.svg.classList.remove('is-hidden');

    const defs = svg('defs');
    const glyphs = svg('g');
    const labels = svg('g');
    this.svg.append(defs, glyphs, labels);

    let n = 0;
    layout(text, this.size).forEach(({ char, cx, cy, box }, ci) => {
      const paths = data[char] ?? [];
      const k = (box / KVG.box) * KVG.scale;
      const toKvg = `translate(${cx} ${cy}) scale(${k}) translate(${-KVG.box / 2 + KVG.dx} ${-KVG.box / 2 + KVG.dy})`;
      const maskId = `order-${run}-${ci}`;
      const mask = svg('mask', { id: maskId, maskUnits: 'userSpaceOnUse', x: 0, y: 0, width: this.size, height: this.size });
      const mg = svg('g', { transform: toKvg });
      mask.append(mg);
      defs.append(mask);

      const attrs = glyphAttrs(cx, cy, box);
      const glyph = svg('text', { ...attrs, class: 'order-glyph', mask: `url(#${maskId})` });
      glyph.textContent = char;
      glyphs.append(glyph);

      for (const d of paths) {
        const delay = n * STROKE_MS;
        n += 1;
        const path = svg('path', { d, pathLength: 1, 'stroke-width': MASK_WIDTH });
        path.style.animationDelay = `${delay}ms`;
        path.style.animationDuration = `${STROKE_MS * 0.85}ms`;
        mg.append(path);
        // かきはじめの位置に ばんごう
        const m = /^[Mm]\s*([-\d.]+)[,\s]+([-\d.]+)/.exec(d);
        if (m) {
          const x = cx + (Number(m[1]) - KVG.box / 2 + KVG.dx) * k;
          const y = cy + (Number(m[2]) - KVG.box / 2 + KVG.dy) * k;
          const r = this.size * 0.037;
          const label = svg('g', { class: 'order-num', transform: `translate(${x} ${y})` });
          label.style.animationDelay = `${delay}ms`;
          const t = svg('text', { 'font-size': r * 1.3, dy: '0.36em' });
          t.textContent = String(n);
          label.append(svg('circle', { r }), t);
          labels.append(label);
        }
      }

      // さいごに 文字ぜんたいを ぬって、マスクの すきまを うめる
      const fill = svg('text', { ...attrs, class: 'order-glyph order-fill' });
      fill.style.animationDelay = `${n * STROKE_MS}ms`;
      fill.textContent = char;
      glyphs.append(fill);
    });
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
    this.renderGuide();
    if (!this.svg.classList.contains('is-hidden')) this.playOrder();
  }

  /** うすい見本（かきじゅんと同じ SVG の文字で描いて、ぴったり重ねる） */
  private renderGuide(): void {
    this.guideSvg.setAttribute('viewBox', `0 0 ${this.size} ${this.size}`);
    this.guideSvg.replaceChildren(
      ...layout(this.guide, this.size).map(({ char, cx, cy, box }) => {
        const t = svgEl('text', { ...glyphAttrs(cx, cy, box), class: 'guide-glyph' });
        t.textContent = char;
        return t;
      }),
    );
  }

  private redraw(): void {
    const { ctx, size } = this;
    ctx.clearRect(0, 0, size, size);
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
