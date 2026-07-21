import { Pause, Play, RotateCcw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatClock } from "@/lib/mock-draft/format";
import type { DraftStatus, DraftTeam } from "@/lib/mock-draft/types";
import { cn } from "@/lib/utils";
import { NewDraftDialog } from "./new-draft-dialog";

interface DraftHeaderProps {
  currentOverall: number;
  currentRound: number;
  teamCount: number;
  teamOnClock: DraftTeam;
  status: DraftStatus;
  remainingSeconds: number;
  onTogglePause: () => void;
  onAbandon: () => void;
}

export function DraftHeader({
  currentOverall,
  currentRound,
  teamCount,
  teamOnClock,
  status,
  remainingSeconds,
  onTogglePause,
  onAbandon,
}: DraftHeaderProps) {
  const pickInRound = ((currentOverall - 1) % teamCount) + 1;
  const userIsActive = teamOnClock.isUser && status === "active";

  return (
    <Card
      className={cn(
        "py-4 transition-colors",
        userIsActive &&
          "border-primary ring-2 ring-primary/20 motion-safe:animate-pulse",
      )}
    >
      <CardContent className="flex flex-col gap-4 px-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <div>
            <p className="text-sm text-muted-foreground">Draft progress</p>
            <p className="font-semibold">
              Round {currentRound}, Pick {pickInRound}{" "}
              <span className="font-normal text-muted-foreground">
                (Overall {currentOverall})
              </span>
            </p>
          </div>
          <div aria-live="polite">
            <p className="text-sm text-muted-foreground">On the clock</p>
            <p className={cn("font-semibold", userIsActive && "text-primary")}>
              {teamOnClock.isUser ? "YOU" : teamOnClock.name}
              {userIsActive ? " — You're on the clock!" : ""}
            </p>
          </div>
          {teamOnClock.isUser && status === "active" ? (
            <span
              className={cn(
                "font-mono text-2xl font-bold tabular-nums",
                remainingSeconds <= 10 && "text-destructive",
              )}
            >
              {formatClock(remainingSeconds)}
            </span>
          ) : null}
          {status === "paused" ? (
            <Badge variant="secondary">Paused</Badge>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant={status === "paused" ? "default" : "outline"}
            onClick={onTogglePause}
          >
            {status === "paused" ? (
              <Play className="size-4" aria-hidden />
            ) : (
              <Pause className="size-4" aria-hidden />
            )}
            {status === "paused" ? "Resume" : "Pause"}
          </Button>
          <NewDraftDialog onConfirm={onAbandon}>
            <Button type="button" variant="outline">
              <RotateCcw className="size-4" aria-hidden />
              New draft
            </Button>
          </NewDraftDialog>
        </div>
      </CardContent>
    </Card>
  );
}
