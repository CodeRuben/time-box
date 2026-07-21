"use client";

import { Dices } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getRound } from "@/lib/mock-draft/snake";
import type { DraftConfig, DraftState } from "@/lib/mock-draft/types";
import {
  TEAM_COUNT_OPTIONS,
  TIMER_OPTIONS,
  TOTAL_ROUNDS,
} from "@/lib/mock-draft/types";
import { NewDraftDialog } from "./new-draft-dialog";

interface DraftSetupProps {
  savedDraft: DraftState | null;
  onResume: () => void;
  onStart: (config: DraftConfig) => void;
  onDiscard: () => void;
}

function randomSlot(teamCount: DraftConfig["teamCount"]): number {
  return Math.floor(Math.random() * teamCount) + 1;
}

function getSavedDraftSummary(state: DraftState): string {
  if (state.status === "complete") {
    return "Draft complete";
  }

  const overall = state.picks.length + 1;
  const pickInRound = ((overall - 1) % state.config.teamCount) + 1;
  const round = getRound(overall, state.config.teamCount);
  return `Round ${round} of ${TOTAL_ROUNDS} — pick ${pickInRound} of ${state.config.teamCount} — ${state.config.teamCount} teams`;
}

export function DraftSetup({
  savedDraft,
  onResume,
  onStart,
  onDiscard,
}: DraftSetupProps) {
  const [teamCount, setTeamCount] =
    useState<DraftConfig["teamCount"]>(12);
  const [timerSeconds, setTimerSeconds] =
    useState<DraftConfig["timerSeconds"]>(60);
  const [userSlot, setUserSlot] = useState(() => randomSlot(12));

  if (savedDraft) {
    return (
      <main className="min-h-screen px-4 py-10 sm:px-6 lg:px-8">
        <Card className="mx-auto max-w-xl">
          <CardHeader>
            <CardTitle>Resume your Mock Draft</CardTitle>
            <CardDescription>
              {getSavedDraftSummary(savedDraft)}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row">
            <Button onClick={onResume}>
              {savedDraft.status === "complete"
                ? "View results"
                : "Resume draft"}
            </Button>
            <NewDraftDialog onConfirm={onDiscard}>
              <Button variant="outline">
                Start new draft (discards saved draft)
              </Button>
            </NewDraftDialog>
          </CardContent>
        </Card>
      </main>
    );
  }

  const handleTeamCountChange = (value: string) => {
    const next = Number(value) as DraftConfig["teamCount"];
    setTeamCount(next);
    setUserSlot((current) => Math.min(current, next));
  };

  return (
    <main className="min-h-screen px-4 py-10 sm:px-6 lg:px-8">
      <Card className="mx-auto max-w-xl">
        <CardHeader>
          <CardTitle className="text-2xl">Mock Draft</CardTitle>
          <CardDescription>
            Draft a 14-player fantasy roster against AI opponents.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-6"
            onSubmit={(event) => {
              event.preventDefault();
              onStart({ teamCount, timerSeconds, userSlot });
            }}
          >
            <div className="grid gap-2">
              <Label htmlFor="mock-draft-teams">Teams</Label>
              <Select
                value={String(teamCount)}
                onValueChange={handleTeamCountChange}
              >
                <SelectTrigger id="mock-draft-teams" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TEAM_COUNT_OPTIONS.map((option) => (
                    <SelectItem key={option} value={String(option)}>
                      {option} teams
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="mock-draft-timer">Pick timer</Label>
              <Select
                value={String(timerSeconds)}
                onValueChange={(value) =>
                  setTimerSeconds(
                    Number(value) as DraftConfig["timerSeconds"],
                  )
                }
              >
                <SelectTrigger id="mock-draft-timer" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMER_OPTIONS.map((option) => (
                    <SelectItem key={option} value={String(option)}>
                      {option} seconds
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="mock-draft-slot">Your draft spot</Label>
              <Select
                value={String(userSlot)}
                onValueChange={(value) => setUserSlot(Number(value))}
              >
                <SelectTrigger id="mock-draft-slot" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: teamCount }, (_, index) => index + 1).map(
                    (slot) => (
                      <SelectItem key={slot} value={String(slot)}>
                        Slot {slot}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setUserSlot(randomSlot(teamCount))}
              >
                <Dices className="size-4" aria-hidden />
                Randomize draft order
              </Button>
              <Button type="submit" className="sm:ml-auto">
                Start draft
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
