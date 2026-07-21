"use client";

import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  isRosterFull,
  withinCaps,
} from "@/lib/mock-draft/roster";
import type {
  DraftStatus,
  Player,
  Position,
} from "@/lib/mock-draft/types";
import { cn } from "@/lib/utils";
import { PlayerHeadshot } from "./player-headshot";

const FILTERS: Array<Position | "ALL"> = [
  "ALL",
  "QB",
  "RB",
  "WR",
  "TE",
  "K",
  "DST",
];

interface BestAvailableProps {
  players: Player[];
  userRoster: Player[];
  status: DraftStatus;
  isUserOnClock: boolean;
  picksUntilUserTurn: number | null;
  onDraft: (playerId: number) => void;
}

export function BestAvailable({
  players,
  userRoster,
  status,
  isUserOnClock,
  picksUntilUserTurn,
  onDraft,
}: BestAvailableProps) {
  const [position, setPosition] = useState<Position | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const normalizedSearch = search.trim().toLowerCase();
  const filtered = useMemo(
    () =>
      players
        .filter(
          (player) => position === "ALL" || player.position === position,
        )
        .filter((player) =>
          player.name.toLowerCase().includes(normalizedSearch),
        )
        .slice(0, 50),
    [normalizedSearch, players, position],
  );
  const positionCounts = useMemo(
    () =>
      Object.fromEntries(
        FILTERS.map((filter) => [
          filter,
          filter === "ALL"
            ? players.length
            : players.filter((player) => player.position === filter).length,
        ]),
      ) as Record<Position | "ALL", number>,
    [players],
  );
  const canDraftNow = status === "active" && isUserOnClock;

  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>Best Available</CardTitle>
        <CardDescription>
          {canDraftNow
            ? "Choose a player for your roster."
            : picksUntilUserTurn === null
              ? "Browse the remaining Board."
              : picksUntilUserTurn === 0
                ? "Resume the draft to make your pick."
                : `You pick in ${picksUntilUserTurn} ${picksUntilUserTurn === 1 ? "pick" : "picks"}.`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2" role="tablist">
          {FILTERS.map((filter) => (
            <Button
              key={filter}
              type="button"
              size="sm"
              variant={position === filter ? "default" : "outline"}
              role="tab"
              aria-selected={position === filter}
              onClick={() => setPosition(filter)}
            >
              {filter === "ALL" ? "All" : filter}
              <Badge
                variant="secondary"
                className={cn(
                  "ml-1",
                  position === filter && "bg-primary-foreground/20 text-inherit",
                )}
              >
                {positionCounts[filter]}
              </Badge>
            </Button>
          ))}
        </div>
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search players"
          aria-label="Search Best Available"
        />

        <div className="max-h-[44rem] overflow-y-auto rounded-lg border">
          {filtered.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-muted-foreground">
              No available players match those filters.
            </p>
          ) : (
            <div className="divide-y">
              {filtered.map((player) => {
                const atCap = !withinCaps(userRoster, player.position);
                const rosterFull = isRosterFull(userRoster);
                const legal = !atCap && !rosterFull;
                const disabled = !canDraftNow || !legal;
                const title = atCap
                  ? `${player.position} limit reached`
                  : rosterFull
                    ? "Roster is full"
                    : undefined;

                return (
                  <div
                    key={player.id}
                    className="grid grid-cols-[3rem_minmax(0,1fr)_auto] items-center gap-3 px-3 py-3 sm:grid-cols-[3rem_minmax(0,1fr)_4rem_3rem_3.5rem_auto]"
                  >
                    <span className="text-sm tabular-nums text-muted-foreground">
                      {player.rank}
                    </span>
                    <div className="flex min-w-0 items-center gap-3">
                      <PlayerHeadshot player={player} />
                      <div className="min-w-0">
                        <p className="truncate font-medium">{player.name}</p>
                        <p className="text-xs text-muted-foreground sm:hidden">
                          {player.nflTeam} · Bye {player.bye}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline">{player.position}</Badge>
                    <span className="hidden text-sm text-muted-foreground sm:block">
                      {player.nflTeam}
                    </span>
                    <span className="hidden text-sm text-muted-foreground sm:block">
                      Bye {player.bye}
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      disabled={disabled}
                      title={title}
                      onClick={() => onDraft(player.id)}
                    >
                      Draft
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
