"use client";

import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { NFL_TEAMS, type NflTeam } from "@/lib/draft-rankings/types";
import { cn } from "@/lib/utils";

interface TeamFiltersProps {
  activeTeams: ReadonlySet<NflTeam>;
  onToggle: (team: NflTeam) => void;
  onClear: () => void;
}

function selectedTeams(activeTeams: ReadonlySet<NflTeam>): NflTeam[] {
  return NFL_TEAMS.filter((team) => activeTeams.has(team));
}

function triggerLabel(activeTeams: ReadonlySet<NflTeam>): string {
  if (activeTeams.size === 0) {
    return "Filter by team";
  }

  return `Filter by team, ${selectedTeams(activeTeams).join(", ")} selected`;
}

function teamsMatchingQuery(query: string): readonly NflTeam[] {
  const normalized = query.trim().toUpperCase();
  if (normalized === "") {
    return NFL_TEAMS;
  }

  return NFL_TEAMS.filter((team) => team.includes(normalized));
}

export function TeamFilters({
  activeTeams,
  onToggle,
  onClear,
}: TeamFiltersProps) {
  const [query, setQuery] = useState("");
  const selected = selectedTeams(activeTeams);
  const visibleTeams = useMemo(() => teamsMatchingQuery(query), [query]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          size="sm"
          variant="outline"
          aria-label={triggerLabel(activeTeams)}
          className={cn(
            "h-8 gap-2 rounded-md border bg-background px-2.5 font-medium shadow-xs",
            selected.length > 0 && "border-foreground/20 bg-muted/60",
          )}
        >
          <span className="text-sm">Teams</span>
          {selected.length > 0 ? (
            <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-foreground px-1.5 text-[10px] font-semibold leading-4 text-background tabular-nums">
              {selected.length}
            </span>
          ) : null}
          <ChevronDown className="size-3.5 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56 p-0">
        <div className="border-b px-3 py-2">
          <p className="text-sm font-medium">Teams</p>
          <p className="text-xs text-muted-foreground">
            Highlight players on any selected team.
          </p>
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search teams"
            aria-label="Search teams"
            className="mt-2 h-8"
          />
        </div>
        <ul className="max-h-64 overflow-y-auto p-1">
          {visibleTeams.length === 0 ? (
            <li className="px-2 py-1.5 text-sm text-muted-foreground">
              No teams match.
            </li>
          ) : (
            visibleTeams.map((team) => {
              const selectedTeam = activeTeams.has(team);
              const id = `team-filter-${team}`;

              return (
                <li key={team}>
                  <Label
                    htmlFor={id}
                    className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 font-normal hover:bg-accent"
                  >
                    <Checkbox
                      id={id}
                      checked={selectedTeam}
                      onCheckedChange={() => onToggle(team)}
                    />
                    <span className="font-medium tabular-nums">{team}</span>
                  </Label>
                </li>
              );
            })
          )}
        </ul>
        <div className="border-t p-1">
          <button
            type="button"
            className="flex w-full items-center rounded-sm px-2 py-1.5 text-sm hover:bg-accent disabled:pointer-events-none disabled:opacity-50"
            onClick={onClear}
            disabled={selected.length === 0}
          >
            Clear teams
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
