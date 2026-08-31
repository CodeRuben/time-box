import type { Position } from "./types";

export const POSITION_CELL_CLASS: Record<Position, string> = {
  QB: "bg-purple-700 text-white",
  RB: "bg-sky-500 text-white",
  WR: "bg-emerald-500 text-white",
  TE: "bg-amber-600 text-white",
  K: "bg-violet-500 text-white",
  DST: "bg-stone-500 text-white",
};

export const POSITION_CARD_CLASS: Record<Position, string> = {
  QB: "bg-purple-700 text-white border-purple-800",
  RB: "bg-sky-500 text-white border-sky-600",
  WR: "bg-emerald-500 text-white border-emerald-600",
  TE: "bg-amber-600 text-white border-amber-700",
  K: "bg-violet-500 text-white border-violet-600",
  DST: "bg-stone-500 text-white border-stone-600",
};

export const POSITION_COMPACT_CARD_CLASS: Record<Position, string> = {
  QB: "bg-purple-700 text-white border-purple-800 dark:bg-purple-700/55 dark:border-purple-800/50",
  RB: "bg-sky-500 text-white border-sky-600 dark:bg-sky-500/55 dark:border-sky-600/50",
  WR: "bg-emerald-500 text-white border-emerald-600 dark:bg-emerald-500/55 dark:border-emerald-600/50",
  TE: "bg-amber-600 text-white border-amber-700 dark:bg-amber-600/55 dark:border-amber-700/50",
  K: "bg-violet-500 text-white border-violet-600 dark:bg-violet-500/55 dark:border-violet-600/50",
  DST: "bg-stone-500 text-white border-stone-600 dark:bg-stone-500/55 dark:border-stone-600/50",
};
