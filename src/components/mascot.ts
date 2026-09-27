// あんないキャラ（画像枠＋吹き出し）。
// セリフは自動では消えない・切り替わらない。タップで次のセリフへ進む。
import type { Character } from '../data/characters';
import { fitText, phraseHtml } from '../lib/fit';
import { icon } from '../lib/icons';

export interface MascotOptions {
  /** large: 上半身を大きく / small: 顔を丸く切り抜き */
  size?: 'large' | 'small';
  /** 吹き出しの位置 */
  bubble?: 'top' | 'right';
}

// 表示サイズごとの拡大率（枠の幅に対する画像の幅）と、顔からどれだけ下を中心にするか
const FRAMING = {
  large: { zoom: 1.5, dy: 0.12 },
  small: { zoom: 2.7, dy: 0 },
};

const aspectCache = new Map<string, number>();

/** 画像上の顔の位置が枠の中央に来るように背景として表示する */
export function framePortrait(
  el: HTMLElement,
  src: string,
  face: { x: number; y: number },
  size: 'large' | 'small',
): void {
  const { zoom, dy } = FRAMING[size];
  const apply = (aspect: number) => {
    const w = el.clientWidth || 1;
    const h = el.clientHeight || 1;
    const kx = zoom; // 画像幅 / 枠幅
    const ky = (zoom * w * aspect) / h; // 画像高さ / 枠高さ
    const pos = (f: number, k: number) =>
      k === 1 ? 50 : Math.min(100, Math.max(0, ((0.5 - f * k) / (1 - k)) * 100));
    el.style.backgroundImage = `url("${src}")`;
    el.style.backgroundSize = `${zoom * 100}% auto`;
    el.style.backgroundPosition = `${pos(face.x, kx)}% ${pos(face.y + dy, ky)}%`;
    el.classList.remove('is-empty');
  };
  const cached = aspectCache.get(src);
  if (cached) return apply(cached);
  const probe = new Image();
  probe.onload = () => {
    const aspect = probe.naturalHeight / probe.naturalWidth;
    aspectCache.set(src, aspect);
    apply(aspect);
  };
  probe.onerror = () => el.classList.add('is-empty');
  probe.src = src;
}

export class Mascot {
  readonly el: HTMLElement;
  private frame: HTMLElement;
  private bubbleEl: HTMLElement;
  private textEl: HTMLElement;
  private queue: string[] = [];
  private loopLines: string[] = [];
  private loopIndex = 0;
  private observer: ResizeObserver;
  private size: 'large' | 'small';

  constructor(
    readonly character: Character,
    opts: MascotOptions = {},
  ) {
    this.size = opts.size ?? 'large';
    this.el = document.createElement('div');
    this.el.className = `mascot mascot--${this.size} mascot--bubble-${opts.bubble ?? 'top'}`;
    this.el.style.setProperty('--chara', character.color);

    this.bubbleEl = document.createElement('button');
    this.bubbleEl.className = 'mascot-bubble';
    this.bubbleEl.setAttribute('aria-live', 'polite');
    this.textEl = document.createElement('span');
    this.textEl.className = 'mascot-text';
    const more = document.createElement('span');
    more.className = 'mascot-more';
    more.append(icon('more', { size: 18 }));
    this.bubbleEl.append(this.textEl, more);
    this.bubbleEl.addEventListener('click', () => this.advance());

    this.frame = document.createElement('div');
    this.frame.className = 'mascot-frame is-empty';
    this.frame.setAttribute('role', 'img');
    this.frame.setAttribute('aria-label', character.name);
    const placeholder = document.createElement('span');
    placeholder.className = 'mascot-placeholder';
    placeholder.textContent = 'きゃら';
    this.frame.append(placeholder);
    this.frame.addEventListener('click', () => this.advance());

    this.el.append(this.bubbleEl, this.frame);

    // サイズが決まったら（変わったら）切り抜き位置と文字サイズを合わせ直す
    this.observer = new ResizeObserver(() => {
      framePortrait(this.frame, import.meta.env.BASE_URL + character.image, character.face, this.size);
      if (this.bubbleEl.classList.contains('is-visible')) fitText(this.textEl);
    });
    this.observer.observe(this.frame);
    this.observer.observe(this.bubbleEl);
  }

  /** しゃべる（タップするまで消えない）。複数渡すとタップで順番に進む */
  say(...lines: string[]): void {
    this.loopLines = [];
    this.queue = lines.slice(1);
    this.show(lines[0]);
  }

  /** タップするたびに lines を順番に（最後まで行ったら最初から）話す */
  talkLoop(lines: string[]): void {
    this.queue = [];
    this.loopLines = lines;
    this.loopIndex = Math.floor(Math.random() * lines.length);
    this.show(lines[this.loopIndex]);
  }

  hush(): void {
    this.bubbleEl.classList.remove('is-visible');
  }

  private advance(): void {
    if (this.queue.length > 0) {
      this.show(this.queue.shift()!);
    } else if (this.loopLines.length > 0) {
      this.loopIndex = (this.loopIndex + 1) % this.loopLines.length;
      this.show(this.loopLines[this.loopIndex]);
    } else {
      this.bounce();
    }
  }

  private show(text: string): void {
    const hasMore = this.queue.length > 0 || this.loopLines.length > 1;
    this.bubbleEl.classList.toggle('has-more', hasMore);
    this.textEl.style.fontSize = '';
    delete this.textEl.dataset.fitMax;
    this.textEl.innerHTML = phraseHtml(text);
    this.bubbleEl.classList.add('is-visible');
    fitText(this.textEl);
    this.bounce();
  }

  bounce(): void {
    this.el.classList.remove('is-bouncing');
    void this.el.offsetWidth; // アニメーションを再スタート
    this.el.classList.add('is-bouncing');
  }

  destroy(): void {
    this.observer.disconnect();
  }
}
