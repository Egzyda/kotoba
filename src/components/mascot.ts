// あんないキャラクター（画像枠＋吹き出し）。
// キャラの画像・セリフは src/data/characters.ts で管理する。
import { MASCOT_TIMING } from '../config';
import type { Character } from '../data/characters';
import { withFurigana } from '../lib/furigana';

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

/** 画像上の点 (fx, fy) を枠の中央に持ってくる background-position を計算する */
export function framePortrait(
  el: HTMLElement,
  src: string,
  face: { x: number; y: number },
  size: 'large' | 'small',
  onError?: () => void,
): void {
  const { zoom, dy } = FRAMING[size];
  const probe = new Image();
  probe.onload = () => {
    const aspect = probe.naturalHeight / probe.naturalWidth;
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
  probe.onerror = () => {
    el.classList.add('is-empty');
    onError?.();
  };
  probe.src = src;
}

export class Mascot {
  readonly el: HTMLElement;
  private frame: HTMLElement;
  private bubbleEl: HTMLElement;
  private bubbleTimer?: number;
  private chatterTimer?: number;
  private kickoffTimer?: number;

  constructor(
    readonly character: Character,
    opts: MascotOptions = {},
  ) {
    const size = opts.size ?? 'large';
    this.el = document.createElement('div');
    this.el.className = `mascot mascot--${size} mascot--bubble-${opts.bubble ?? 'top'}`;
    this.el.style.setProperty('--chara', character.color);

    this.bubbleEl = document.createElement('div');
    this.bubbleEl.className = 'mascot-bubble';
    this.bubbleEl.setAttribute('aria-live', 'polite');

    this.frame = document.createElement('div');
    this.frame.className = 'mascot-frame is-empty';
    this.frame.setAttribute('role', 'img');
    this.frame.setAttribute('aria-label', character.name);
    const placeholder = document.createElement('span');
    placeholder.className = 'mascot-placeholder';
    placeholder.textContent = 'きゃら';
    this.frame.append(placeholder);
    this.frame.addEventListener('click', () => this.bounce());

    this.el.append(this.bubbleEl, this.frame);
    // レイアウト確定後に切り抜き位置を計算
    requestAnimationFrame(() =>
      framePortrait(
        this.frame,
        import.meta.env.BASE_URL + character.image,
        character.face,
        size,
      ),
    );
  }

  /** 吹き出しでしゃべる。カタカナには自動でふりがなが付く */
  say(text: string, durationMs = MASCOT_TIMING.bubbleDurationMs): void {
    window.clearTimeout(this.bubbleTimer);
    this.bubbleEl.innerHTML = withFurigana(text);
    this.bubbleEl.classList.add('is-visible');
    this.bounce();
    if (durationMs > 0) {
      this.bubbleTimer = window.setTimeout(() => this.hush(), durationMs);
    }
  }

  hush(): void {
    this.bubbleEl.classList.remove('is-visible');
  }

  /** ときどきランダムにしゃべる */
  startChatter(lines: string[], intervalMs = MASCOT_TIMING.chatterIntervalMs): void {
    this.stopChatter();
    let last = -1;
    const speak = () => {
      let i = Math.floor(Math.random() * lines.length);
      if (lines.length > 1 && i === last) i = (i + 1) % lines.length;
      last = i;
      this.say(lines[i]);
    };
    this.chatterTimer = window.setInterval(speak, intervalMs);
    this.kickoffTimer = window.setTimeout(speak, 800);
  }

  stopChatter(): void {
    window.clearInterval(this.chatterTimer);
    window.clearTimeout(this.kickoffTimer);
  }

  bounce(): void {
    this.el.classList.remove('is-bouncing');
    void this.el.offsetWidth; // アニメーションを再スタート
    this.el.classList.add('is-bouncing');
  }

  destroy(): void {
    this.stopChatter();
    window.clearTimeout(this.bubbleTimer);
  }
}
