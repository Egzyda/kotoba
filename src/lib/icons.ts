// アイコンは Lucide（SVG）に統一する。機種依存の絵文字は使わない。
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  Eraser,
  Layers,
  Loader,
  PenLine,
  Pencil,
  Play,
  Puzzle,
  RefreshCw,
  RotateCcw,
  Shuffle,
  Star,
  Users,
  createElement,
  type IconNode,
} from 'lucide';

export const ICONS = {
  back: ArrowLeft,
  next: ArrowRight,
  prev: ArrowLeft,
  check: Check,
  more: ChevronRight,
  eraser: Eraser,
  cards: Layers,
  loading: Loader,
  write: PenLine,
  trace: Pencil,
  play: Play,
  order: Puzzle,
  update: RefreshCw,
  again: RotateCcw,
  random: Shuffle,
  star: Star,
  chara: Users,
} satisfies Record<string, IconNode>;

export type IconName = keyof typeof ICONS;

export function icon(name: IconName, opts: { size?: number; fill?: string } = {}): SVGElement {
  const el = createElement(ICONS[name], {
    width: opts.size ?? 24,
    height: opts.size ?? 24,
    'stroke-width': 2.5,
    'aria-hidden': 'true',
    ...(opts.fill ? { fill: opts.fill } : {}),
  });
  el.classList.add('icon');
  return el;
}
