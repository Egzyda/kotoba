// 「さいしんに する」ボタンの処理。
// ホーム画面に追加（スタンドアロン起動）すると通常のリロード手段が無いため、
// アプリ内から最新版を取り直せるようにする。

export type UpdateResult = 'latest' | 'reloading' | 'offline';

async function fetchLatestVersion(): Promise<string | null> {
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}version.json?t=${Date.now()}`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { version?: string };
    return data.version ?? null;
  } catch {
    return null;
  }
}

async function clearCaches(): Promise<void> {
  try {
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    }
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
  } catch {
    // 失敗してもリロードは試みる
  }
}

function hardReload(): void {
  const url = new URL(window.location.href);
  url.searchParams.set('v', String(Date.now()));
  window.location.replace(url.toString());
}

/**
 * 最新版があれば取り直してリロードする。
 * @param force true なら同じバージョンでも強制的に取り直す
 */
export async function updateToLatest(force = false): Promise<UpdateResult> {
  const latest = await fetchLatestVersion();
  if (latest === null && !force) return 'offline';
  if (latest === __APP_VERSION__ && !force) return 'latest';
  await clearCaches();
  hardReload();
  return 'reloading';
}

/** 起動時に付けたキャッシュ回避用の ?v= を URL から消す */
export function cleanupReloadParam(): void {
  const url = new URL(window.location.href);
  if (!url.searchParams.has('v')) return;
  url.searchParams.delete('v');
  history.replaceState(null, '', url.toString());
}
