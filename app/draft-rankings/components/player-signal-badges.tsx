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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PLAYER_NAME_BY_KEY } from "@/lib/draft-rankings/players";
import type { PlayerSignal } from "@/lib/draft-rankings/types";
import { cn } from "@/lib/utils";

interface PlayerSignalBadgesProps {
  signals: readonly PlayerSignal[];
  className?: string;
}

interface SignalPresentation {
  Icon: LucideIcon;
  description: string;
  className: string;
}

function formatProjectedPoints(points: number): string {
  return points.toFixed(1);
}

function getSignalPresentation(signal: PlayerSignal): SignalPresentation {
  switch (signal.kind) {
    case "injury-risk":
      return {
        Icon: HeartPulse,
        description: "Injury risk watchlist",
        className: "border-rose-200 bg-rose-100 text-rose-800",
      };
    case "veteran-age":
      return {
        Icon: Hourglass,
        description: `Veteran age: ${signal.age}, threshold ${signal.threshold}+`,
        className: "border-amber-200 bg-amber-100 text-amber-900",
      };
    case "rookie":
      return {
        Icon: Sprout,
        description: `${signal.classYear} rookie`,
        className: "border-sky-200 bg-sky-100 text-sky-900",
      };
    case "offense-tier": {
      const isGood = signal.tier === "good";
      return {
        Icon: isGood ? TrendingUp : TrendingDown,
        description: `${isGood ? "Good" : "Bad"} offense: ${formatProjectedPoints(signal.projectedPointsPerGame)} projected points per game`,
        className: isGood
          ? "border-emerald-200 bg-emerald-100 text-emerald-900"
          : "border-orange-200 bg-orange-100 text-orange-900",
      };
    }
    case "contingent-upside": {
      const dependencyName =
        PLAYER_NAME_BY_KEY.get(signal.dependencyKey) ?? "a teammate";
      return {
        Icon: Rocket,
        description: `Contingent upside if ${dependencyName} is unavailable`,
        className: "border-violet-200 bg-violet-100 text-violet-900",
      };
    }
    default: {
      const exhaustiveSignal: never = signal;
      return exhaustiveSignal;
    }
  }
}

function PlayerSignalBadge({ signal }: { signal: PlayerSignal }) {
  const { Icon, description, className } = getSignalPresentation(signal);

  return (
    <span role="listitem">
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            aria-label={description}
            className="inline-flex size-6 items-center justify-center rounded-full outline-none"
          >
            <Badge
              variant="outline"
              aria-hidden
              className={cn(
                "size-5 border p-0 shadow-xs [&>svg]:size-3",
                className,
              )}
            >
              <Icon />
            </Badge>
          </span>
        </TooltipTrigger>
        <TooltipContent>{description}</TooltipContent>
      </Tooltip>
    </span>
  );
}

export function PlayerSignalBadges({
  signals,
  className,
}: PlayerSignalBadgesProps) {
  if (signals.length === 0) {
    return null;
  }

  return (
    <div
      role="list"
      aria-label="Player signals"
      className={cn(
        "flex min-h-6 flex-wrap items-center justify-center gap-1",
        className,
      )}
    >
      {signals.map((signal) => (
        <PlayerSignalBadge key={signal.kind} signal={signal} />
      ))}
    </div>
  );
}
