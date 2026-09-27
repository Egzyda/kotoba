// 文字データ。ひらがなを正として定義し、カタカナはコードポイント変換で生成する。

export type Script = 'hira' | 'kata';
export type Group = 'seion' | 'dakuon' | 'handakuon' | 'youon';

export interface Kana {
  char: string;
  romaji: string; // 内部管理用。UI には出さない
  group: Group;
  script: Script;
}

/** 表の1行。null は空きマス（や行・わ行など） */
export type KanaRow = (Kana | null)[];

export const GROUPS: { id: Group; label: string }[] = [
  { id: 'seion', label: 'あいうえお' },
  { id: 'dakuon', label: 'てんてん' },
  { id: 'handakuon', label: 'まる' },
  { id: 'youon', label: 'ちいさい ゃゅょ' },
];

// '_' は空きマス
const HIRA_TABLE: Record<Group, [string, string][]> = {
  seion: [
    ['あ い う え お', 'a i u e o'],
    ['か き く け こ', 'ka ki ku ke ko'],
    ['さ し す せ そ', 'sa shi su se so'],
    ['た ち つ て と', 'ta chi tsu te to'],
    ['な に ぬ ね の', 'na ni nu ne no'],
    ['は ひ ふ へ ほ', 'ha hi fu he ho'],
    ['ま み む め も', 'ma mi mu me mo'],
    ['や _ ゆ _ よ', 'ya _ yu _ yo'],
    ['ら り る れ ろ', 'ra ri ru re ro'],
    ['わ _ を _ ん', 'wa _ wo _ n'],
  ],
  dakuon: [
    ['が ぎ ぐ げ ご', 'ga gi gu ge go'],
    ['ざ じ ず ぜ ぞ', 'za ji zu ze zo'],
    ['だ ぢ づ で ど', 'da di du de do'],
    ['ば び ぶ べ ぼ', 'ba bi bu be bo'],
  ],
  handakuon: [['ぱ ぴ ぷ ぺ ぽ', 'pa pi pu pe po']],
  youon: [
    ['きゃ きゅ きょ', 'kya kyu kyo'],
    ['しゃ しゅ しょ', 'sha shu sho'],
    ['ちゃ ちゅ ちょ', 'cha chu cho'],
    ['にゃ にゅ にょ', 'nya nyu nyo'],
    ['ひゃ ひゅ ひょ', 'hya hyu hyo'],
    ['みゃ みゅ みょ', 'mya myu myo'],
    ['りゃ りゅ りょ', 'rya ryu ryo'],
    ['ぎゃ ぎゅ ぎょ', 'gya gyu gyo'],
    ['じゃ じゅ じょ', 'ja ju jo'],
    ['びゃ びゅ びょ', 'bya byu byo'],
    ['ぴゃ ぴゅ ぴょ', 'pya pyu pyo'],
  ],
};

export function hiraToKata(s: string): string {
  return s.replace(/[ぁ-ゖ]/g, (c) => String.fromCharCode(c.charCodeAt(0) + 0x60));
}

export function kataToHira(s: string): string {
  return s.replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));
}

export function getRows(script: Script, group: Group): KanaRow[] {
  return HIRA_TABLE[group].map(([chars, romaji]) => {
    const cs = chars.split(' ');
    const rs = romaji.split(' ');
    return cs.map((c, i) =>
      c === '_'
        ? null
        : { char: script === 'kata' ? hiraToKata(c) : c, romaji: rs[i], group, script },
    );
  });
}

/** グループ内の文字を並び順どおりに（空きマス除く） */
export function getList(script: Script, group: Group): Kana[] {
  return getRows(script, group)
    .flat()
    .filter((k): k is Kana => k !== null);
}

export function findKana(script: Script, char: string): Kana | undefined {
  for (const g of GROUPS) {
    const hit = getList(script, g.id).find((k) => k.char === char);
    if (hit) return hit;
  }
  return undefined;
}

/** 行（あ行など）の文字。row は getRows の添字 */
export function getRowList(script: Script, group: Group, row: number): Kana[] {
  return (getRows(script, group)[row] ?? []).filter((k): k is Kana => k !== null);
}

/** 小さい ゃゅょ などを前の文字とまとめて「1文字ぶん」に分ける（きゃ・しゅ など） */
export function splitUnits(word: string): string[] {
  const units: string[] = [];
  for (const c of word) {
    if (c === ' ') continue;
    if (/[ゃゅょぁぃぅぇぉャュョァィゥェォ]/.test(c) && units.length > 0) {
      units[units.length - 1] += c;
    } else {
      units.push(c);
    }
  }
  return units;
}

export function toScript(s: string, script: Script): string {
  return script === 'kata' ? hiraToKata(s) : kataToHira(s);
}
