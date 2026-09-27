// 応援マスコット。画像は src/config.ts の MASCOT.images で差し替える。
// 画像が無い間は枠（プレースホルダー）を表示する。
import { MASCOT, type MascotMood } from '../config';
import { withFurigana } from '../lib/furigana';

export interface MascotOptions {
  size?: 'large' | 'small';
  mood?: MascotMood;
  /** 吹き出しの位置 */
  bubble?: 'top' | 'right';
}

export class Mascot {
  readonly el: HTMLElement;
  private img: HTMLImageElement;
  private bubbleEl: HTMLElement;
  private bubbleTimer?: number;
  private chatterTimer?: number;
  private kickoffTimer?: number;
  private mood: MascotMood = 'normal';

  constructor(opts: MascotOptions = {}) {
    this.el = document.createElement('div');
    this.el.className = `mascot mascot--${opts.size ?? 'large'} mascot--bubble-${opts.bubble ?? 'top'}`;

    this.bubbleEl = document.createElement('div');
    this.bubbleEl.className = 'mascot-bubble';
    this.bubbleEl.setAttribute('aria-live', 'polite');

    const frame = document.createElement('div');
    frame.className = 'mascot-frame is-empty';
    const placeholder = document.createElement('span');
    placeholder.className = 'mascot-placeholder';
    placeholder.textContent = 'きゃら';

    this.img = document.createElement('img');
    this.img.alt = '';
    this.img.draggable = false;
    this.img.addEventListener('load', () => frame.classList.remove('is-empty'));
    this.img.addEventListener('error', () => {
      // 表情画像が無ければ normal に、normal も無ければ枠のみ
      if (this.mood !== 'normal') this.setMood('normal');
      else frame.classList.add('is-empty');
    });

    frame.append(placeholder, this.img);
    frame.addEventListener('click', () => this.bounce());
    this.el.append(this.bubbleEl, frame);
    this.setMood(opts.mood ?? 'normal');
  }

  setMood(mood: MascotMood): void {
    this.mood = mood;
    this.img.src = import.meta.env.BASE_URL + MASCOT.images[mood];
  }

  /** 吹き出しでしゃべる。カタカナには自動でふりがなが付く */
  say(text: string, durationMs = MASCOT.bubbleDurationMs): void {
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
  startChatter(lines: string[], intervalMs = MASCOT.chatterIntervalMs): void {
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
