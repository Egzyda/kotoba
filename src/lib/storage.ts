// 進捗の保存（localStorage）。読めない環境でも落ちないよう全て try/catch。

const KEY = 'kotoba:v1';

export interface Progress {
  stars: number;
  /** 文字ごとの獲得スター数（キーは表示文字） */
  perChar: Record<string, number>;
}

const empty = (): Progress => ({ stars: 0, perChar: {} });

export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty();
    return { ...empty(), ...(JSON.parse(raw) as Partial<Progress>) };
  } catch {
    return empty();
  }
}

export function saveProgress(p: Progress): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    // 保存できなくても遊べるので無視
  }
}

export function addStar(char: string, n = 1): Progress {
  const p = loadProgress();
  p.stars += n;
  p.perChar[char] = (p.perChar[char] ?? 0) + n;
  saveProgress(p);
  return p;
}

// あんないキャラクター（未選択なら null）
const CHARA_KEY = 'kotoba:character';

export function loadCharacterId(): string | null {
  try {
    return localStorage.getItem(CHARA_KEY);
  } catch {
    return null;
  }
}

export function saveCharacterId(id: string): void {
  try {
    localStorage.setItem(CHARA_KEY, id);
  } catch {
    // 保存できなくても遊べるので無視
  }
}

// ちょっとした設定（最後に使った ひらがな/カタカナ、ならべよう の レベル など）
export function loadPref<T extends string>(key: string, fallback: T, allowed: readonly T[]): T {
  try {
    const v = localStorage.getItem(`kotoba:pref:${key}`) as T | null;
    return v !== null && allowed.includes(v) ? v : fallback;
  } catch {
    return fallback;
  }
}

export function savePref(key: string, value: string): void {
  try {
    localStorage.setItem(`kotoba:pref:${key}`, value);
  } catch {
    // 無視
  }
}
