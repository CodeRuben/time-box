"use client";

import { Button } from "@/components/ui/button";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { FeatureGate } from "@/app/components/feature-gate";

import { DraftModeToggle } from "./components/draft-mode-toggle";
import { PlayerSignalFilters } from "./components/player-signal-filters";
import { PositionFilters } from "./components/position-filters";
import { RankingsBoard } from "./components/rankings-board";
import { ViewModeToggle } from "./components/view-mode-toggle";
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
          <h1 className="text-2xl font-semibold tracking-tight">Draft</h1>
          <p className="text-sm text-muted-foreground">
            {rankings.draftMode
              ? "Click a player when they are selected. Click again to undo. Reset restores the original board."
              : "Drag players to reorder your board. Use position and signal filters to highlight matches without changing the order."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <ViewModeToggle
            compact={rankings.view === "compact"}
            onToggle={rankings.toggleView}
          />
          <DraftModeToggle
            enabled={rankings.draftMode}
            takenCount={rankings.takenCount}
            availableCount={rankings.availableCount}
            onToggle={rankings.toggleDraftMode}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <PositionFilters
          activePositions={rankings.activePositions}
          onToggle={rankings.togglePosition}
        />
        <PlayerSignalFilters
          activeFilters={rankings.activeSignalFilters}
          onToggle={rankings.toggleSignalFilter}
          onClear={rankings.clearSignalFilters}
        />
        <div className="ml-auto flex gap-2">
          {rankings.hasActiveFilters ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={rankings.clearFilters}
            >
              Clear filters
            </Button>
          ) : null}
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={rankings.resetBoard}
          >
            Reset
          </Button>
        </div>
      </div>

      <RankingsBoard
        players={rankings.players}
        activePositions={rankings.activePositions}
        activeSignalFilters={rankings.activeSignalFilters}
        draftMode={rankings.draftMode}
        compact={rankings.view === "compact"}
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
