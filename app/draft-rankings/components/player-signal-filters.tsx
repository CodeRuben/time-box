"use client";

import { ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { PlayerSignalFilterId } from "@/lib/draft-rankings/types";
import { cn } from "@/lib/utils";

import {
  SIGNAL_FILTER_OPTIONS,
  SIGNAL_FILTER_STYLES,
  SignalIconBadge,
} from "./player-signal-style";

interface PlayerSignalFiltersProps {
  activeFilters: Set<PlayerSignalFilterId>;
  onToggle: (filterId: PlayerSignalFilterId) => void;
  onClear: () => void;
}

function selectedFilterIds(
  activeFilters: Set<PlayerSignalFilterId>,
): PlayerSignalFilterId[] {
  return SIGNAL_FILTER_OPTIONS.filter((option) => activeFilters.has(option.id)).map(
    (option) => option.id,
  );
}

function triggerLabel(activeFilters: Set<PlayerSignalFilterId>): string {
  if (activeFilters.size === 0) {
    return "Filter by player signals";
  }

  const labels = selectedFilterIds(activeFilters).map(
    (id) => SIGNAL_FILTER_STYLES[id].label,
  );

  return `Filter by player signals, ${labels.join(", ")} selected`;
}

export function PlayerSignalFilters({
  activeFilters,
  onToggle,
  onClear,
}: PlayerSignalFiltersProps) {
  const selectedIds = selectedFilterIds(activeFilters);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          size="sm"
          variant="outline"
          aria-label={triggerLabel(activeFilters)}
          className={cn(
            "h-8 gap-2 rounded-md border bg-background px-2.5 font-medium shadow-xs",
            selectedIds.length > 0 && "border-foreground/20 bg-muted/60",
          )}
        >
          {selectedIds.length > 0 ? (
            <span className="flex items-center" aria-hidden>
              {selectedIds.map((id, index) => (
                <span
                  key={id}
                  className={cn(
                    "inline-flex rounded-full ring-2 ring-background",
                    index > 0 && "-ml-1.5",
                  )}
                >
                  <SignalIconBadge filterId={id} />
                </span>
              ))}
            </span>
          ) : null}
          <span className="text-sm">Signals</span>
          {selectedIds.length > 0 ? (
            <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-foreground px-1.5 text-[10px] font-semibold leading-4 text-background tabular-nums">
              {selectedIds.length}
            </span>
          ) : null}
          <ChevronDown className="size-3.5 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-0">
        <div className="border-b px-3 py-2">
          <p className="text-sm font-medium">Player signals</p>
          <p className="text-xs text-muted-foreground">
            Highlight players that match any selected icon.
          </p>
        </div>
        <ul className="p-1">
          {SIGNAL_FILTER_OPTIONS.map((option) => {
            const selected = activeFilters.has(option.id);
            const id = `player-signal-filter-${option.id}`;

            return (
              <li key={option.id}>
                <Label
                  htmlFor={id}
                  className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 font-normal hover:bg-accent"
                >
                  <Checkbox
                    id={id}
                    checked={selected}
                    onCheckedChange={() => onToggle(option.id)}
                  />
                  <SignalIconBadge filterId={option.id} />
                  <span>{option.label}</span>
                </Label>
              </li>
            );
          })}
        </ul>
        <div className="border-t p-1">
          <button
            type="button"
            className="flex w-full items-center rounded-sm px-2 py-1.5 text-sm hover:bg-accent disabled:pointer-events-none disabled:opacity-50"
            onClick={onClear}
            disabled={selectedIds.length === 0}
          >
            Clear signals
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
