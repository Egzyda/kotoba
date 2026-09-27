// たしかめ ダイアログ。こどもの うっかり操作を ふせぐため、OK は「ながおし」で決定する。
import { h } from '../lib/dom';
import { withFurigana } from '../lib/furigana';
import { icon, type IconName } from '../lib/icons';

const HOLD_MS = 1500;

export function confirmHold(opts: {
  message: string;
  okLabel: string;
  okIcon?: IconName;
  onOk: () => void;
}): void {
  const okBtn = h('button', { class: 'dialog-ok' }, [
    h('span', { class: 'dialog-ok-fill' }),
    ...(opts.okIcon ? [icon(opts.okIcon)] : []),
    h('span', { html: withFurigana(opts.okLabel) }),
  ]);
  const cancelBtn = h('button', { class: 'btn-action', text: 'やめる' });
  const dialog = h('div', { class: 'dialog', role: 'dialog' }, [
    h('p', { class: 'dialog-msg', html: withFurigana(opts.message) }),
    h('p', { class: 'dialog-hint', text: 'ながおしで きまるよ' }),
    h('div', { class: 'dialog-actions' }, [cancelBtn, okBtn]),
  ]);
  const overlay = h('div', { class: 'dialog-overlay' }, [dialog]);

  let timer: number | undefined;
  const close = () => {
    window.clearTimeout(timer);
    overlay.remove();
    window.removeEventListener('hashchange', close);
  };
  const start = (e: PointerEvent) => {
    e.preventDefault();
    okBtn.classList.add('is-holding');
    timer = window.setTimeout(() => {
      close();
      opts.onOk();
    }, HOLD_MS);
  };
  const stop = () => {
    okBtn.classList.remove('is-holding');
    window.clearTimeout(timer);
  };
  okBtn.style.setProperty('--hold', `${HOLD_MS}ms`);
  okBtn.addEventListener('pointerdown', start);
  okBtn.addEventListener('pointerup', stop);
  okBtn.addEventListener('pointerleave', stop);
  okBtn.addEventListener('pointercancel', stop);
  okBtn.addEventListener('contextmenu', (e) => e.preventDefault());
  cancelBtn.addEventListener('click', close);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });
  window.addEventListener('hashchange', close);
  document.getElementById('app')!.append(overlay);
}
