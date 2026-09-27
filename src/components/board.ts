// なぞり書きボード（Canvas）。
// - 見本と かきじゅんは animCJK のデータ（public/data/strokes.json）を つかう
//   1画ごとに「画の かたち（o）」と「ふでの とおりみち（m）」が セットに なっている
// - 見本: すべての画の かたちを うすく ぬる（とめ・はね・はらい が でる）
// - かきじゅん: とおりみちを 太い線で のばし、その画の かたちで きりぬく → 1画ずつ ぴったり ぬられる
//   （なぞりはじめると かきじゅん表示は消える。右上のボタンで もう一度 見られる）
import { h } from '../lib/dom';
import { icon } from '../lib/icons';

const SVG_NS = 'http://www.w3.org/2000/svg';

/** 1画（いくつかの パーツに わかれることが ある） */
type Stroke = { o: string; m: string }[];

const BOX = 1024; // animCJK の 座標の大きさ
const GLYPH_SCALE = 0.9; // マスに たいする 文字の大きさ
const STROKE_MS = 700;
const MEDIAN_WIDTH = 150; // とおりみちの 線の太さ（画の はばより 太く）
let clipSeq = 0;

let strokeData: Promise<Record<string, Stroke[]>> | null = null;
function loadStrokes(): Promise<Record<string, Stroke[]>> {
  strokeData ??= fetch(`${import.meta.env.BASE_URL}data/strokes.json`)
    .then((r) => r.json() as Promise<Record<string, Stroke[]>>)
    .catch(() => ({}));
  return strokeData;
}

/** 文字ごとの配置（中心と、1文字ぶんの マスの大きさ）。きゃ などは 半分の大きさで ならべる */
function layout(text: string, size: number): { char: string; cx: number; cy: number; box: number }[] {
  const chars = [...text];
  const box = size / chars.length;
  return chars.map((char, i) => ({ char, cx: box * (i + 0.5), cy: size / 2, box }));
}

/** animCJK の座標 → ボードの座標 */
function glyphTransform(cx: number, cy: number, box: number): string {
  const k = (box / BOX) * GLYPH_SCALE;
  return `translate(${cx} ${cy}) scale(${k}) translate(${-BOX / 2} ${-BOX / 2})`;
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
    replay.addEventListener('click', () => void this.playOrder());
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
    void this.renderGuide();
    void this.playOrder();
  }

  clear(): void {
    this.strokes = [];
    this.redraw();
  }

  get hasStrokes(): boolean {
    return this.strokes.length > 0;
  }

  /** かきじゅんアニメーション（1画ずつ、その画の かたちの中だけを ぬる） */
  async playOrder(): Promise<void> {
    const text = this.guide;
    const data = await loadStrokes();
    if (text !== this.guide || this.size === 0) return;
    const run = ++clipSeq;
    this.svg.replaceChildren();
    this.svg.setAttribute('viewBox', `0 0 ${this.size} ${this.size}`);
    this.svg.classList.remove('is-hidden');

    const defs = svgEl('defs');
    const glyphs = svgEl('g');
    const labels = svgEl('g');
    this.svg.append(defs, glyphs, labels);

    const anims: { path: SVGPathElement; delay: number }[] = [];
    let n = 0;
    layout(text, this.size).forEach(({ char, cx, cy, box }, ci) => {
      const g = svgEl('g', { transform: glyphTransform(cx, cy, box) });
      glyphs.append(g);
      const k = (box / BOX) * GLYPH_SCALE;
      for (const stroke of data[char] ?? []) {
        const delay = n * STROKE_MS;
        n += 1;
        stroke.forEach((part, pi) => {
          const clipId = `clip-${run}-${ci}-${n}-${pi}`;
          const clip = svgEl('clipPath', { id: clipId });
          clip.append(svgEl('path', { d: part.o }));
          defs.append(clip);
          const path = svgEl('path', {
            d: part.m,
            class: 'order-median',
            'stroke-width': MEDIAN_WIDTH,
            'clip-path': `url(#${clipId})`,
          }) as SVGPathElement;
          g.append(path);
          anims.push({ path, delay });
        });
        // かきはじめの位置に ばんごう
        const m = /^M\s*([-\d.]+)[,\s]+([-\d.]+)/.exec(stroke[0]?.m ?? '');
        if (m) {
          const x = cx + (Number(m[1]) - BOX / 2) * k;
          const y = cy + (Number(m[2]) - BOX / 2) * k;
          const r = this.size * 0.037;
          const label = svgEl('g', { class: 'order-num', transform: `translate(${x} ${y})` });
          label.style.animationDelay = `${delay}ms`;
          const t = svgEl('text', { 'font-size': r * 1.3, dy: '0.36em' });
          t.textContent = String(n);
          label.append(svgEl('circle', { r }), t);
          labels.append(label);
        }
      }
    });

    // 線の ながさを じっさいに はかって、その ながさで のばす
    // （pathLength で ちぢめる方法は iPhone の Safari で てんせんに なるため つかわない）
    for (const { path, delay } of anims) {
      const len = Math.ceil(path.getTotalLength()) + MEDIAN_WIDTH;
      path.style.strokeDasharray = `${len} ${len}`;
      path.style.strokeDashoffset = `${len}`;
      path.animate([{ strokeDashoffset: `${len}` }, { strokeDashoffset: '0' }], {
        delay,
        duration: STROKE_MS * 0.85,
        easing: 'ease-in-out',
        fill: 'forwards',
      });
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
    void this.renderGuide();
    if (!this.svg.classList.contains('is-hidden')) void this.playOrder();
  }

  /** うすい見本（かきじゅんと おなじ データの 画の かたちを ぬる） */
  private async renderGuide(): Promise<void> {
    const text = this.guide;
    const data = await loadStrokes();
    if (text !== this.guide) return;
    this.guideSvg.setAttribute('viewBox', `0 0 ${this.size} ${this.size}`);
    this.guideSvg.replaceChildren(
      ...layout(text, this.size).map(({ char, cx, cy, box }) => {
        const g = svgEl('g', { transform: glyphTransform(cx, cy, box), class: 'guide-glyph' });
        for (const stroke of data[char] ?? []) for (const part of stroke) g.append(svgEl('path', { d: part.o }));
        return g;
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
