import {
  Minus,
  ShieldAlert,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

import type { DefenseScheduleDifficulty } from "@/lib/draft-rankings/defense-schedule";

export interface DefenseScheduleDifficultyStyle {
  label: string;
  Icon: LucideIcon;
  className: string;
}

export const DEFENSE_SCHEDULE_DIFFICULTY_STYLES: Record<
  DefenseScheduleDifficulty,
  DefenseScheduleDifficultyStyle
> = {
  easy: {
    label: "Easy",
    Icon: ShieldCheck,
    className: "border-emerald-200 bg-emerald-100 text-emerald-900",
  },
  average: {
    label: "Average",
    Icon: Minus,
    className: "border-slate-200 bg-slate-100 text-slate-800",
  },
  hard: {
    label: "Hard",
    Icon: ShieldAlert,
    className: "border-rose-200 bg-rose-100 text-rose-800",
  },
};

export function formatDefenseScheduleSummary(schedule: {
  difficulty: DefenseScheduleDifficulty;
  rank: number;
}): string {
  const { label } = DEFENSE_SCHEDULE_DIFFICULTY_STYLES[schedule.difficulty];
  return `${label} schedule, rank ${schedule.rank} of 32`;
}

export function formatMatchupLocation(location: "home" | "away"): string {
  return location === "home" ? "vs" : "@";
}
