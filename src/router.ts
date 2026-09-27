// ハッシュベースの簡易ルーター（Cloudflare Pages で追加設定なしに動かすため）。

export type Cleanup = () => void;
export type Screen = (root: HTMLElement, params: URLSearchParams) => Cleanup | void;

const routes = new Map<string, Screen>();
let cleanup: Cleanup | void;

export function defineRoute(path: string, screen: Screen): void {
  routes.set(path, screen);
}

export function go(path: string, params?: Record<string, string>): void {
  const q = params ? `?${new URLSearchParams(params).toString()}` : '';
  window.location.hash = `#${path}${q}`;
}

/** 履歴を積まずに遷移（文字送りなど） */
export function replace(path: string, params?: Record<string, string>): void {
  const q = params ? `?${new URLSearchParams(params).toString()}` : '';
  window.location.replace(`#${path}${q}`);
}

function render(root: HTMLElement): void {
  const hash = window.location.hash.slice(1) || '/';
  const [path, query = ''] = hash.split('?');
  const screen = routes.get(path) ?? routes.get('/')!;
  cleanup?.();
  root.replaceChildren();
  root.scrollTop = 0;
  cleanup = screen(root, new URLSearchParams(query));
}

export function startRouter(root: HTMLElement): void {
  window.addEventListener('hashchange', () => render(root));
  render(root);
}
