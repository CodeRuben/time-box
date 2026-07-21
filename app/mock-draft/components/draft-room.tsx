"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { DraftState, DraftTeam, Player } from "@/lib/mock-draft/types";
import type { ResolvedPick } from "../hooks/use-mock-draft";
import { BestAvailable } from "./best-available";
import { DraftBoard } from "./draft-board";
import { DraftHeader } from "./draft-header";
import { MyRoster } from "./my-roster";
import { PickTicker } from "./pick-ticker";

interface DraftRoomProps {
  state: DraftState;
  currentOverall: number;
  currentRound: number;
  teamOnClock: DraftTeam;
  remainingSeconds: number;
  recentPicks: ResolvedPick[];
  availablePlayers: Player[];
  userRoster: Player[];
  isUserOnClock: boolean;
  picksUntilUserTurn: number | null;
  onDraftPlayer: (playerId: number) => void;
  onTogglePause: () => void;
  onAbandon: () => void;
}

export function DraftRoom({
  state,
  currentOverall,
  currentRound,
  teamOnClock,
  remainingSeconds,
  recentPicks,
  availablePlayers,
  userRoster,
  isUserOnClock,
  picksUntilUserTurn,
  onDraftPlayer,
  onTogglePause,
  onAbandon,
}: DraftRoomProps) {
  const [view, setView] = useState<"draft" | "board">("draft");

  return (
    <main className="min-h-screen px-3 py-4 sm:px-6 lg:px-8 lg:py-6">
      <div className="mx-auto max-w-[100rem] space-y-4">
        <DraftHeader
          currentOverall={currentOverall}
          currentRound={currentRound}
          teamCount={state.config.teamCount}
          teamOnClock={teamOnClock}
          status={state.status}
          remainingSeconds={remainingSeconds}
          onTogglePause={onTogglePause}
          onAbandon={onAbandon}
        />
        <PickTicker
          picks={recentPicks}
          teamCount={state.config.teamCount}
        />

        <div className="flex gap-2" role="tablist" aria-label="Draft view">
          <Button
            type="button"
            variant={view === "draft" ? "default" : "outline"}
            role="tab"
            aria-selected={view === "draft"}
            onClick={() => setView("draft")}
          >
            Best Available
          </Button>
          <Button
            type="button"
            variant={view === "board" ? "default" : "outline"}
            role="tab"
            aria-selected={view === "board"}
            onClick={() => setView("board")}
          >
            Full Board
          </Button>
        </div>

        {view === "draft" ? (
          <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(20rem,1fr)]">
            <BestAvailable
              players={availablePlayers}
              userRoster={userRoster}
              status={state.status}
              isUserOnClock={isUserOnClock}
              picksUntilUserTurn={picksUntilUserTurn}
              onDraft={onDraftPlayer}
            />
            <MyRoster roster={userRoster} />
          </div>
        ) : (
          <DraftBoard state={state} />
        )}
      </div>
    </main>
  );
}
