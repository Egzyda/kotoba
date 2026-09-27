import { loadCharacterId } from '../lib/storage';

// あんないキャラクター（名探偵プリキュア！）。
// 画像は public/img/chara/ に置き、ここでパスと顔の位置を指定する。
// セリフはひらがな・カタカナのみ（カタカナには自動でふりがなが付く）。

export interface CharacterLines {
  greet: string; // えらばれたとき
  home: string[]; // ホームでときどき話す
  praise: string[]; // できたとき
  traceEmpty: string; // なぞらずに「できた」を押したとき
  cardsHint: string; // たんごカード画面に入ったとき
  updateLatest: string; // さいしんに する → もう最新
  updateOffline: string; // さいしんに する → つながらない
}

export interface Character {
  id: string;
  name: string; // へんしんまえの なまえ（ひらがな）
  cureName: string;
  color: string; // イメージカラー（枠や吹き出しのアクセント）
  image: string; // public/ からのパス
  /** 顔の中心（画像の幅・高さに対する割合）。丸アイコンの切り抜きに使う */
  face: { x: number; y: number };
  lines: CharacterLines;
}

export const CHARACTERS: Character[] = [
  {
    id: 'anna',
    name: 'あんな',
    cureName: 'キュアアンサー',
    color: '#a77bdb',
    image: 'img/chara/anna.jpg',
    face: { x: 0.54, y: 0.2 },
    // まっすぐで ちょっかんタイプ。くちぐせ「はなまる！」
    lines: {
      greet: 'あんなだよ！ いっしょに もじの なぞを とこう！',
      home: [
        'きょうは どの もじに する？',
        'なぞって みよう！ ぜったい できるよ！',
        'こまったら わたしに まかせて！',
        'カードも あるよ！ めくって みよう！',
        'どんな もじでも はなまる かいけつ！',
      ],
      praise: ['はなまる！', 'はなまる！ すごい すごい！', 'やったね！ だいせいかい！'],
      traceEmpty: 'ゆびで なぞって みて！',
      cardsHint: 'タッチで めくって みよう！',
      updateLatest: 'もう さいしんだよ！ はなまる！',
      updateOffline: 'いまは つながらないみたい…',
    },
  },
  {
    id: 'mikuru',
    name: 'みくる',
    cureName: 'キュアミスティック',
    color: '#ff6b9a',
    image: 'img/chara/mikuru.jpg',
    face: { x: 0.5, y: 0.21 },
    // まじめで がんばりや。かわいいもの が すき。ていねいな ことば
    lines: {
      greet: 'みくるです！ いっしょに がんばりましょう！',
      home: [
        'どの もじに しますか？',
        'いっしょに なぞって みましょう！',
        'こつこつ がんばれば だいじょうぶです！',
        'この もじ、とっても かわいいですね！',
        'カードも みて みませんか？',
      ],
      praise: ['すごいです！ よく できました！', 'とっても じょうずです！', 'がんばりましたね！'],
      traceEmpty: 'ゆびで なぞって みてください！',
      cardsHint: 'タッチで めくって みてください！',
      updateLatest: 'もう さいしんです！',
      updateOffline: 'いまは つながらないみたいです…',
    },
  },
  {
    id: 'kurea',
    name: 'くれあ',
    cureName: 'キュアエクレール',
    color: '#3fb8d0',
    image: 'img/chara/kurea.jpg',
    face: { x: 0.32, y: 0.19 },
    // おだやかで やさしい おねえさん。ていねいな ことば
    lines: {
      greet: 'くれあです。 ゆっくり いっしょに まなびましょうね。',
      home: [
        'きょうは どの もじに しましょうか？',
        'あせらなくて だいじょうぶですよ。',
        'ていねいに なぞって みましょうね。',
        'カードで ことばも みて みましょう。',
      ],
      praise: ['すてきです。 よく できましたね。', 'おみごとです！', 'その ちょうしですよ。'],
      traceEmpty: 'ゆびで そっと なぞって みましょうね。',
      cardsHint: 'タッチすると めくれますよ。',
      updateLatest: 'もう さいしんですよ。',
      updateOffline: 'いまは つながらないようですね。',
    },
  },
  {
    id: 'ruruka',
    name: 'るるか',
    cureName: 'キュアアルカナ・シャドウ',
    color: '#6b5a8e',
    image: 'img/chara/ruruka.jpg',
    face: { x: 0.62, y: 0.14 },
    // マイペースで くちかず すくなめ。アイスが すき
    lines: {
      greet: 'るるか。 …よろしく。',
      home: [
        '…どの もじ？',
        'ふうん。 やって みる？',
        'おわったら アイス たべたい。',
        '…もじの めいきゅうへ いこう。',
      ],
      praise: ['…やるじゃない。', 'いいかんじ。', '…すごい。 ほんとに。'],
      traceEmpty: '…ゆびで なぞって。',
      cardsHint: 'タッチ。 めくれるよ。',
      updateLatest: '…もう さいしん。',
      updateOffline: 'つながらない。 …あとで。',
    },
  },
];

export function getCharacter(id: string | null | undefined): Character | undefined {
  return CHARACTERS.find((c) => c.id === id);
}

/** えらばれているキャラ（未選択なら先頭） */
export function currentCharacter(): Character {
  return getCharacter(loadCharacterId()) ?? CHARACTERS[0];
}

export function pick<T>(list: T[]): T {
  return list[Math.floor(Math.random() * list.length)];
}
