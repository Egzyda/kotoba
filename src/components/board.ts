// なぞり書きボード（Canvas）。ガイド文字を薄く描き、指の軌跡を重ねる。
// 採点（SPEC 4章）は今後ここに追加する。
import { h } from '../lib/dom';

const FONT = '"M PLUS Rounded 1c", sans-serif';

export class TraceBoard {
  readonly el: HTMLElement;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private strokes: { x: number; y: number }[][] = [];
  private size = 0;
  private guide = '';
  private observer: ResizeObserver;

  constructor() {
    this.canvas = h('canvas', { class: 'board-canvas' });
    this.ctx = this.canvas.getContext('2d')!;
    this.el = h('div', { class: 'board' }, [this.canvas]);

    const pos = (e: PointerEvent) => {
      const r = this.canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    this.canvas.addEventListener('pointerdown', (e) => {
      this.canvas.setPointerCapture(e.pointerId);
      this.strokes.push([pos(e)]);
      this.redraw();
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

  setGuide(text: string): void {
    this.guide = text;
    this.strokes = [];
    this.redraw();
    document.fonts?.load(`800 100px ${FONT}`, text).then(() => this.redraw(), () => {});
  }

  clear(): void {
    this.strokes = [];
    this.redraw();
  }

  get hasStrokes(): boolean {
    return this.strokes.length > 0;
  }

  private resize(): void {
    const size = Math.floor(Math.min(this.el.clientWidth, this.el.clientHeight));
    if (size <= 0 || size === this.size) return;
    this.size = size;
    const dpr = window.devicePixelRatio || 1;
    this.canvas.style.width = `${size}px`;
    this.canvas.style.height = `${size}px`;
    this.canvas.width = size * dpr;
    this.canvas.height = size * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.redraw();
  }

  private redraw(): void {
    const { ctx, size } = this;
    ctx.clearRect(0, 0, size, size);
    // ガイド文字
    ctx.save();
    ctx.fillStyle = 'rgba(255, 107, 154, 0.2)';
    ctx.font = `800 ${size * (this.guide.length > 1 ? 0.5 : 0.8)}px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.guide, size / 2, size / 2 + size * 0.03);
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
