// かこう / ならべる の「じゅんばん モード」。文字えらびで えらんだ文字から、
// その グループ（または ぎょう）の 単語を じゅんばんに出す。ひとまわり したら おわり。
import { findKana, getList, getRowList, type Group, type Kana, type Script } from '../data/kana';
import { wordFor, type Word } from '../data/words';

export interface WordRun {
  script: Script;
  group: Group;
  row: string | null;
  list: Kana[];
  index: number;
  word: Word;
}

/** URL に char があれば じゅんばん モード、無ければ null（ランダム） */
export function parseRun(params: URLSearchParams): WordRun | null {
  const char = params.get('char');
  if (!char) return null;
  const script: Script = params.get('script') === 'kata' ? 'kata' : 'hira';
  const kana = findKana(script, char);
  if (!kana) return null;
  const row = params.get('row');
  const list = (row !== null ? getRowList(script, kana.group, Number(row)) : getList(script, kana.group)).filter(
    (k) => wordFor(k.char) !== null,
  );
  const index = list.findIndex((k) => k.char === kana.char);
  const word = wordFor(kana.char);
  if (index < 0 || !word) return null;
  return { script, group: kana.group, row, list, index, word };
}

export function runParams(run: WordRun, index: number): Record<string, string> {
  return {
    script: run.script,
    group: run.group,
    char: run.list[index].char,
    ...(run.row !== null ? { row: run.row } : {}),
  };
}

export function isLastInRun(run: WordRun): boolean {
  return run.index === run.list.length - 1;
}
