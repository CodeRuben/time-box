"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { getTeamRoster } from "@/lib/mock-draft/engine";
import { formatOrdinal } from "@/lib/mock-draft/format";
import { gradeDraft } from "@/lib/mock-draft/grading";
import type { DraftState, Position } from "@/lib/mock-draft/types";
import { DraftBoard } from "./draft-board";
import { NewDraftDialog } from "./new-draft-dialog";
import { TeamGradeCard } from "./team-grade-card";

interface DraftResultsProps {
  state: DraftState;
  onAbandon: () => void;
}

const POSITIONS: Position[] = ["QB", "RB", "WR", "TE", "K", "DST"];

export function DraftResults({
  state,
  onAbandon,
}: DraftResultsProps) {
  const [showBoard, setShowBoard] = useState(false);
  const grades = useMemo(() => gradeDraft(state), [state]);
  const userGrade = grades.find((grade) => grade.isUser);
  const positionMaximums = useMemo(
    () =>
      Object.fromEntries(
        POSITIONS.map((position) => [
          position,
          Math.max(...grades.map((grade) => grade.positionValue[position])),
        ]),
      ) as Record<Position, number>,
    [grades],
  );

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <header>
          <h1 className="text-3xl font-bold">Draft Results</h1>
          <p className="mt-2 text-muted-foreground">
            {userGrade
              ? `You finished ${formatOrdinal(userGrade.leagueRank)} of ${state.config.teamCount}.`
              : "Final league standings"}
          </p>
        </header>

        <div className="space-y-3">
          {grades.map((grade) => (
            <TeamGradeCard
              key={grade.slot}
              grade={grade}
              roster={getTeamRoster(state, grade.slot)}
              positionMaximums={positionMaximums}
            />
          ))}
        </div>

        <div className="flex flex-wrap gap-3">
          <NewDraftDialog onConfirm={onAbandon}>
            <Button>Start new draft</Button>
          </NewDraftDialog>
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowBoard((current) => !current)}
          >
            {showBoard ? "Hide board" : "View board"}
          </Button>
        </div>

        {showBoard ? <DraftBoard state={state} /> : null}
      </div>
    </main>
  );
}
