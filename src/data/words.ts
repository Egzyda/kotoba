// 単語データ。キーは ひらがな 1文字（拗音は2文字）。
// - 単語は ひらがな で書き、カタカナモードでは自動でカタカナに変換する
// - その文字で始まる単語が無いときは、文字を含む単語でよい（ん → りぼん）
// - 「を」は例外で みじかい ぶん（ほんを よむ）
// - null は ちょうどいい単語が無い文字（ぢ など）。カードではキャラのリアクションだけにする
// 絵は Fluent Emoji（MIT ライセンス）を public/img/words/ に同梱している

export interface Word {
  word: string;
  image: string; // public/img/words/<image>.svg
  /** えを みて かこう / ならべよう の出題に使うか（音まねや 抽象的なものは除く） */
  quiz: boolean;
}

const w = (word: string, image: string, quiz = true): Word => ({ word, image, quiz });

export const WORDS: Record<string, Word | null> = {
  あ: w('あり', 'ant'),
  い: w('いぬ', 'dog'),
  う: w('うさぎ', 'rabbit'),
  え: w('えんぴつ', 'pencil'),
  お: w('おにぎり', 'rice_ball'),
  か: w('かさ', 'umbrella'),
  き: w('きりん', 'giraffe'),
  く: w('くま', 'bear'),
  け: w('けーき', 'shortcake'),
  こ: w('こあら', 'koala'),
  さ: w('さかな', 'fish'),
  し: w('しか', 'deer'),
  す: w('すいか', 'watermelon'),
  せ: w('せっけん', 'soap'),
  そ: w('そり', 'sled'),
  た: w('たまご', 'egg'),
  ち: w('ちーず', 'cheese_wedge'),
  つ: w('つき', 'crescent_moon'),
  て: w('てんとうむし', 'lady_beetle'),
  と: w('とまと', 'tomato'),
  な: w('なす', 'eggplant'),
  に: w('にんじん', 'carrot'),
  ぬ: w('ぬいぐるみ', 'teddy_bear'),
  ね: w('ねこ', 'cat'),
  の: w('のーと', 'notebook'),
  は: w('はな', 'tulip'),
  ひ: w('ひよこ', 'baby_chick'),
  ふ: w('ふね', 'ship'),
  へ: w('へび', 'snake'),
  ほ: w('ほし', 'star'),
  ま: w('まど', 'window'),
  み: w('みかん', 'tangerine'),
  む: w('むし', 'bug'),
  め: w('めがね', 'glasses'),
  も: w('もも', 'peach'),
  や: w('やま', 'mountain'),
  ゆ: w('ゆき', 'snowflake'),
  よ: w('よっと', 'sailboat'),
  ら: w('らいおん', 'lion'),
  り: w('りんご', 'red_apple'),
  る: w('るーぺ', 'magnifying_glass_tilted_left'),
  れ: w('れもん', 'lemon'),
  ろ: w('ろけっと', 'rocket'),
  わ: w('わに', 'crocodile'),
  を: w('ほんを よむ', 'open_book', false),
  ん: w('りぼん', 'ribbon'),

  が: w('がっこう', 'school'),
  ぎ: w('ぎたー', 'guitar'),
  ぐ: w('えのぐ', 'artist_palette'),
  げ: w('げーむ', 'video_game'),
  ご: w('ごりら', 'gorilla'),
  ざ: w('ざりがに', 'lobster'),
  じ: w('じてんしゃ', 'bicycle'),
  ず: w('ずぼん', 'jeans'),
  ぜ: w('かぜ', 'leaf_fluttering_in_wind'),
  ぞ: w('ぞう', 'elephant'),
  だ: w('だんご', 'dango'),
  ぢ: null,
  づ: w('こづつみ', 'package'),
  で: w('でんしゃ', 'light_rail'),
  ど: w('どーなつ', 'doughnut'),
  ば: w('ばなな', 'banana'),
  び: w('えび', 'shrimp'),
  ぶ: w('ぶどう', 'grapes'),
  べ: w('べんとう', 'bento_box'),
  ぼ: w('ぼうし', 'billed_cap'),

  ぱ: w('ぱん', 'bread'),
  ぴ: w('ぴざ', 'pizza'),
  ぷ: w('ぷりん', 'custard'),
  ぺ: w('ぺんぎん', 'penguin'),
  ぽ: w('ぽすと', 'postbox'),

  きゃ: w('きゃべつ', 'leafy_green'),
  きゅ: w('きゅうり', 'cucumber'),
  きょ: w('きょうりゅう', 'sauropod'),
  しゃ: w('しゃつ', 't-shirt'),
  しゅ: w('はくしゅ', 'clapping_hands'),
  しょ: w('しょうぼうしゃ', 'fire_engine'),
  ちゃ: w('おちゃ', 'teacup_without_handle'),
  ちゅ: w('ちゅーりっぷ', 'tulip'),
  ちょ: w('ちょうちょ', 'butterfly'),
  にゃ: w('にゃんこ', 'cat_face', false),
  にゅ: w('ぎゅうにゅう', 'glass_of_milk'),
  にょ: w('にょろにょろ', 'worm', false),
  ひゃ: w('ひゃく', 'hundred_points', false),
  ひゅ: w('ひゅーひゅー', 'wind_face', false),
  ひょ: w('ひょう', 'leopard'),
  みゃ: w('さんみゃく', 'snow-capped_mountain', false),
  みゅ: w('みゅーじっく', 'musical_notes', false),
  みょ: null,
  りゃ: null,
  りゅ: w('りゅう', 'dragon'),
  りょ: w('りょうり', 'cooking'),
  ぎゃ: w('ぎゃおー', 't-rex', false),
  ぎゅ: w('ぎゅうにゅう', 'glass_of_milk'),
  ぎょ: w('ぎょうざ', 'dumpling'),
  じゃ: w('じゃがいも', 'potato'),
  じゅ: w('じゅーす', 'beverage_box'),
  じょ: w('じょうぎ', 'straight_ruler'),
  びゃ: null,
  びゅ: w('びゅーん', 'racing_car', false),
  びょ: w('びょういん', 'hospital'),
  ぴゃ: null,
  ぴゅ: w('こんぴゅーた', 'laptop'),
  ぴょ: w('ぴょんぴょん', 'rabbit', false),
};

/** 文字（ひらがな・カタカナ）の単語。無ければ null */
export function wordFor(char: string): Word | null {
  const hira = char.replace(/[\u30a1-\u30f6]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));
  return WORDS[hira] ?? null;
}

export function wordImage(word: Word): string {
  return `${import.meta.env.BASE_URL}img/words/${word.image}.svg`;
}

/** 出題用の単語（重複なし） */
export const QUIZ_WORDS: Word[] = [
  ...new Map(
    Object.values(WORDS)
      .filter((x): x is Word => x !== null && x.quiz)
      .map((x) => [x.word, x]),
  ).values(),
];
