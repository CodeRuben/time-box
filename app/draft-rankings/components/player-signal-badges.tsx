"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PLAYER_NAME_BY_KEY } from "@/lib/draft-rankings/players";
import { getSignalFilterId } from "@/lib/draft-rankings/player-signal-filters";
import type { PlayerSignal } from "@/lib/draft-rankings/types";
import { cn } from "@/lib/utils";

import { SignalIconBadge } from "./player-signal-style";

interface PlayerSignalBadgesProps {
  signals: readonly PlayerSignal[];
  className?: string;
}

function formatProjectedPoints(points: number): string {
  return points.toFixed(1);
}

function getSignalDescription(signal: PlayerSignal): string {
  switch (signal.kind) {
    case "injury-risk":
      return "Injury risk watchlist";
    case "veteran-age":
      return `Veteran age: ${signal.age}, threshold ${signal.threshold}+`;
    case "rookie":
      return `${signal.classYear} rookie`;
    case "offense-tier": {
      const isGood = signal.tier === "good";
      return `${isGood ? "Good" : "Bad"} offense: ${formatProjectedPoints(signal.projectedPointsPerGame)} projected points per game`;
    }
    case "contingent-upside": {
      const dependencyName =
        PLAYER_NAME_BY_KEY.get(signal.dependencyKey) ?? "a teammate";
      return `Contingent upside if ${dependencyName} is unavailable`;
    }
    default: {
      const exhaustiveSignal: never = signal;
      return exhaustiveSignal;
    }
  }
}

function PlayerSignalBadge({ signal }: { signal: PlayerSignal }) {
  const filterId = getSignalFilterId(signal);
  const description = getSignalDescription(signal);

  return (
    <span role="listitem">
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            aria-label={description}
            className="inline-flex size-6 items-center justify-center rounded-full outline-none"
          >
            <SignalIconBadge filterId={filterId} />
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
