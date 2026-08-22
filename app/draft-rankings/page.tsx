"use client";

import { LoadingScreen } from "@/components/ui/loading-screen";
import { FeatureGate } from "@/app/components/feature-gate";

import { DraftModeToggle } from "./components/draft-mode-toggle";
import { PositionFilters } from "./components/position-filters";
import { RankingsBoard } from "./components/rankings-board";
import { useDraftRankings } from "./hooks/use-draft-rankings";

function DraftRankingsPageContent() {
  const rankings = useDraftRankings();

  if (!rankings.isHydrated) {
    return <LoadingScreen />;
  }

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-4 p-4 md:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Draft Rankings</h1>
          <p className="text-sm text-muted-foreground">
            {rankings.draftMode
              ? "Click a player when they are selected. Click again to undo. Reset restores the original board."
              : "Drag players to reorder your board. Use position filters to highlight matches without changing the order."}
          </p>
        </div>
        <DraftModeToggle
          enabled={rankings.draftMode}
          takenCount={rankings.takenCount}
          availableCount={rankings.availableCount}
          onToggle={rankings.toggleDraftMode}
        />
      </div>

      <PositionFilters
        activePositions={rankings.activePositions}
        onToggle={rankings.togglePosition}
        onClear={rankings.clearFilters}
        onReset={rankings.resetBoard}
      />

      <RankingsBoard
        players={rankings.players}
        activePositions={rankings.activePositions}
        draftMode={rankings.draftMode}
        draftedIds={rankings.draftedIds}
        onReorder={rankings.reorder}
        onToggleTaken={rankings.toggleTaken}
      />
    </div>
  );
}

export default function DraftRankingsPage() {
  return (
    <FeatureGate featureKey="draft-rankings">
      <DraftRankingsPageContent />
    </FeatureGate>
  );
}
