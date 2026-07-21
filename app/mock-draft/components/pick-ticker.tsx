"use client";

import { useEffect, useRef } from "react";

import { Badge } from "@/components/ui/badge";
import { formatPickLabel } from "@/lib/mock-draft/format";
import type { ResolvedPick } from "../hooks/use-mock-draft";
import { PlayerHeadshot } from "./player-headshot";

interface PickTickerProps {
  picks: ResolvedPick[];
  teamCount: number;
}

export function PickTicker({ picks, teamCount }: PickTickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    containerRef.current?.scrollTo({ left: 0, behavior: "smooth" });
  }, [picks.length]);

  return (
    <div
      ref={containerRef}
      className="flex min-h-20 gap-3 overflow-x-auto rounded-xl border bg-muted/30 p-3"
      aria-label="Recent picks"
    >
      {picks.length === 0 ? (
        <p className="m-auto text-sm text-muted-foreground">
          Picks will appear here.
        </p>
      ) : (
        picks.map((pick) => (
          <div
            key={pick.overall}
            className={
              pick.team.isUser
                ? "min-w-56 rounded-lg border border-primary/50 bg-primary/10 p-3"
                : "min-w-56 rounded-lg border bg-card p-3"
            }
          >
            <p className="text-xs text-muted-foreground">
              {formatPickLabel(
                pick.round,
                ((pick.overall - 1) % teamCount) + 1,
              )}{" "}
              · {pick.team.name}
            </p>
            <div className="mt-1 flex items-center gap-2">
              <PlayerHeadshot player={pick.player} size="sm" />
              <p className="min-w-0 truncate text-sm font-medium">
                {pick.player.name}{" "}
                <Badge variant="outline">{pick.player.position}</Badge>
              </p>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
