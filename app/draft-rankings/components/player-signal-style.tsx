"use client";

import {
  HeartPulse,
  Hourglass,
  Rocket,
  Sprout,
  TrendingDown,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { PLAYER_SIGNAL_FILTER_IDS, type PlayerSignalFilterId } from "@/lib/draft-rankings/types";
import { cn } from "@/lib/utils";

export interface SignalFilterStyle {
  label: string;
  Icon: LucideIcon;
  className: string;
}

export const SIGNAL_FILTER_STYLES: Record<PlayerSignalFilterId, SignalFilterStyle> =
  {
    "injury-risk": {
      label: "Injury risk",
      Icon: HeartPulse,
      className: "border-rose-200 bg-rose-100 text-rose-800",
    },
    "veteran-age": {
      label: "Veteran age",
      Icon: Hourglass,
      className: "border-amber-200 bg-amber-100 text-amber-900",
    },
    rookie: {
      label: "Rookie",
      Icon: Sprout,
      className: "border-sky-200 bg-sky-100 text-sky-900",
    },
    "offense-good": {
      label: "Good offense",
      Icon: TrendingUp,
      className: "border-emerald-200 bg-emerald-100 text-emerald-900",
    },
    "offense-bad": {
      label: "Bad offense",
      Icon: TrendingDown,
      className: "border-orange-200 bg-orange-100 text-orange-900",
    },
    "contingent-upside": {
      label: "Contingent upside",
      Icon: Rocket,
      className: "border-violet-200 bg-violet-100 text-violet-900",
    },
  };

export const SIGNAL_FILTER_OPTIONS = PLAYER_SIGNAL_FILTER_IDS.map((id) => ({
  id,
  ...SIGNAL_FILTER_STYLES[id],
}));

export function SignalIconBadge({
  filterId,
  className,
}: {
  filterId: PlayerSignalFilterId;
  className?: string;
}) {
  const { Icon, className: colorClass } = SIGNAL_FILTER_STYLES[filterId];

  return (
    <Badge
      variant="outline"
      aria-hidden
      className={cn("size-5 border p-0 shadow-xs [&>svg]:size-3", colorClass, className)}
    >
      <Icon />
    </Badge>
  );
}
