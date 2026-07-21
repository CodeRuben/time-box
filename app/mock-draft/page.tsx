"use client";

import { LoadingScreen } from "@/components/ui/loading-screen";
import { FeatureGate } from "@/app/components/feature-gate";
import { DraftResults } from "./components/draft-results";
import { DraftRoom } from "./components/draft-room";
import { DraftSetup } from "./components/draft-setup";
import { useMockDraft } from "./hooks/use-mock-draft";

function MockDraftPageContent() {
  const draft = useMockDraft();

  if (!draft.isHydrated) {
    return <LoadingScreen />;
  }

  if (draft.phase === "setup") {
    return (
      <DraftSetup
        savedDraft={draft.savedDraft}
        onResume={draft.resumeSavedDraft}
        onStart={draft.startDraft}
        onDiscard={draft.abandonDraft}
      />
    );
  }

  if (!draft.draftState) {
    return <LoadingScreen />;
  }

  if (draft.phase === "results") {
    return (
      <DraftResults
        state={draft.draftState}
        onAbandon={draft.abandonDraft}
      />
    );
  }

  if (!draft.teamOnClock) {
    return <LoadingScreen />;
  }

  return (
    <DraftRoom
      state={draft.draftState}
      currentOverall={draft.currentOverall}
      currentRound={draft.currentRound}
      teamOnClock={draft.teamOnClock}
      remainingSeconds={draft.remainingSeconds}
      recentPicks={draft.recentPicks}
      availablePlayers={draft.availablePlayers}
      userRoster={draft.userRoster}
      isUserOnClock={draft.isUserOnClock}
      picksUntilUserTurn={draft.picksUntilUserTurn}
      onDraftPlayer={draft.draftPlayer}
      onTogglePause={draft.togglePause}
      onAbandon={draft.abandonDraft}
    />
  );
}

export default function MockDraftPage() {
  return (
    <FeatureGate featureKey="mock-draft">
      <MockDraftPageContent />
    </FeatureGate>
  );
}
