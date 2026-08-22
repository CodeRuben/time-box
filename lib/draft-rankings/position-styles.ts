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
