// アプリ全体の差し替えポイントをここに集める。

export type MascotMood = 'normal' | 'happy' | 'cheer';

export const MASCOT = {
  // public/mascot/ に置いた画像のパス。ファイルを差し替えるだけで反映される。
  images: {
    normal: 'mascot/normal.png',
    happy: 'mascot/happy.png',
    cheer: 'mascot/cheer.png',
  } satisfies Record<MascotMood, string>,
  // ホームでときどき話すセリフ（ひらがな・カタカナのみ。カタカナには自動でふりがなが付く）
  homeLines: [
    'いっしょに あそぼう！',
    'きょうは どの もじに する？',
    'なぞって みよう！',
    'カードも あるよ！',
    'がんばってるね！',
  ],
  // セリフが出る間隔（ミリ秒）と表示時間
  chatterIntervalMs: 7000,
  bubbleDurationMs: 4000,
};
