"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { formatOrdinal } from "@/lib/mock-draft/format";
import type {
  PickCallout,
  TeamGrade,
} from "@/lib/mock-draft/grading";
import { PLAYERS } from "@/lib/mock-draft/players";
import type { Player, Position } from "@/lib/mock-draft/types";
import { cn } from "@/lib/utils";
import { MyRoster } from "./my-roster";

const POSITIONS: Position[] = ["QB", "RB", "WR", "TE", "K", "DST"];

const GRADE_COLORS: Record<string, string> = {
  A: "border-emerald-600/30 bg-emerald-600/15 text-emerald-800 dark:text-emerald-300",
  B: "border-lime-600/30 bg-lime-600/15 text-lime-800 dark:text-lime-300",
  C: "border-amber-500/30 bg-amber-500/15 text-amber-800 dark:text-amber-300",
  D: "border-orange-600/30 bg-orange-600/15 text-orange-800 dark:text-orange-300",
  F: "border-red-600/30 bg-red-600/15 text-red-800 dark:text-red-300",
};

interface TeamGradeCardProps {
  grade: TeamGrade;
  roster: Player[];
  positionMaximums: Record<Position, number>;
}

function Callout({
  label,
  callout,
}: {
  label: string;
  callout: PickCallout | null;
}) {
  if (!callout) {
    return null;
  }

  const player = PLAYERS.find(({ id }) => id === callout.playerId);
  if (!player) {
    return null;
  }

  return (
    <p className="text-sm">
      <span className="font-semibold">{label}:</span> {player.name} — rank{" "}
      {player.rank}, picked {formatOrdinal(callout.overall)}
    </p>
  );
}

export function TeamGradeCard({
  grade,
  roster,
  positionMaximums,
}: TeamGradeCardProps) {
  const [isOpen, setIsOpen] = useState(grade.isUser);
  const gradeFamily = grade.letter.charAt(0);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className={cn("py-0", grade.isUser && "border-primary/60")}>
        <CardHeader className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-4 sm:px-6">
          <div className="flex size-10 items-center justify-center rounded-full bg-muted text-lg font-bold">
            {grade.leagueRank}
          </div>
          <div className="min-w-0">
            <p
              className={cn(
                "truncate font-semibold",
                grade.isUser && "text-primary",
              )}
            >
              {grade.name}
            </p>
            <p className="text-sm text-muted-foreground">
              {grade.score.toFixed(1)} points
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={cn(
                "min-w-12 text-base",
                GRADE_COLORS[gradeFamily],
              )}
            >
              {grade.letter}
            </Badge>
            <CollapsibleTrigger asChild>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                aria-label={`${isOpen ? "Collapse" : "Expand"} ${grade.name} grade`}
              >
                {isOpen ? (
                  <ChevronUp className="size-4" />
                ) : (
                  <ChevronDown className="size-4" />
                )}
              </Button>
            </CollapsibleTrigger>
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="grid gap-6 border-t px-4 py-5 sm:px-6 lg:grid-cols-2">
            <MyRoster roster={roster} title={`${grade.name} roster`} embedded />

            <div className="space-y-5">
              <div>
                <h3 className="mb-3 text-sm font-semibold">
                  Position value
                </h3>
                <div className="space-y-2">
                  {POSITIONS.map((position) => {
                    const maximum = positionMaximums[position];
                    const percent =
                      maximum > 0
                        ? (grade.positionValue[position] / maximum) * 100
                        : 0;
                    return (
                      <div
                        key={position}
                        className="grid grid-cols-[2.5rem_1fr_3rem] items-center gap-2 text-xs"
                      >
                        <span className="font-medium">{position}</span>
                        <div className="h-2 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <span className="text-right tabular-nums text-muted-foreground">
                          {grade.positionValue[position].toFixed(1)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-lg bg-muted/50 p-3 text-sm">
                <p>Starter value: {grade.starterValue.toFixed(1)}</p>
                <p>Bench value: {grade.benchValue.toFixed(1)} × 0.25</p>
                {grade.penalties.unfilledStarters > 0 ? (
                  <p className="text-destructive">
                    Unfilled starters: −
                    {grade.penalties.unfilledStarters.toFixed(1)}
                  </p>
                ) : null}
                {grade.penalties.byeStacks > 0 ? (
                  <p className="text-destructive">
                    Bye conflicts: −{grade.penalties.byeStacks.toFixed(1)}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Callout label="Best value" callout={grade.bestValue} />
                <Callout
                  label="Biggest reach"
                  callout={grade.biggestReach}
                />
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
