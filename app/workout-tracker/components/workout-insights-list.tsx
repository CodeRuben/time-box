"use client";

import { format } from "date-fns";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { dateKeyToLocalDate } from "@/lib/date-key";
import { cn } from "@/lib/utils";
import {
  INSIGHT_WORKOUT_TYPE_META,
  type WorkoutInsightEntry,
} from "@/lib/workout-insights";

function statusLabel(status: string): string {
  if (status === "completed") {
    return "Completed";
  }
  if (status === "error") {
    return "Missed";
  }
  return "Pending";
}

function WorkoutInsightRowHeader({
  entry,
  dateLabel,
  expandable,
}: {
  entry: WorkoutInsightEntry;
  dateLabel: string;
  expandable: boolean;
}) {
  const meta = INSIGHT_WORKOUT_TYPE_META[entry.type];

  return (
    <>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">
          {entry.name.trim() || "Untitled workout"}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">{dateLabel}</p>
      </div>
      <span
        className={cn(
          "shrink-0 rounded-md px-2 py-0.5 text-[11px] font-medium",
          meta.badgeClass,
        )}
      >
        {meta.label}
      </span>
      {expandable && (
        <ChevronDown
          className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-150 ease-out-cubic motion-reduce:transition-none"
          aria-hidden
        />
      )}
    </>
  );
}

interface WorkoutInsightsListProps {
  entries: WorkoutInsightEntry[];
  totalEntries: number;
  hasMore: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
}

export function WorkoutInsightsList({
  entries,
  totalEntries,
  hasMore,
  isLoadingMore,
  onLoadMore,
}: WorkoutInsightsListProps) {
  if (entries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No workouts match the selected filters.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-medium text-foreground">Workouts</h3>
        <p className="text-xs text-muted-foreground">
          Showing {entries.length} of {totalEntries}
        </p>
      </div>

      <ul className="scrollbar-themed max-h-96 space-y-2 overflow-y-auto pr-1">
        {entries.map((entry) => {
          const dateLabel = format(
            dateKeyToLocalDate(entry.dateKey),
            "EEE, MMM d, yyyy",
          );
          const hasExercises = entry.subtasks.length > 0;

          return (
            <li key={`${entry.dateKey}-${entry.id}`}>
              {hasExercises ? (
                <Collapsible className="overflow-hidden rounded-lg border border-border/70 bg-card">
                  <CollapsibleTrigger
                    className={cn(
                      "flex w-full items-center gap-2 px-3 py-2 text-left transition-colors duration-150 ease motion-reduce:transition-none",
                      "[@media(hover:hover)_and_(pointer:fine)]:hover:bg-muted/40",
                      "data-[state=open]:border-b data-[state=open]:border-border/60",
                      "[&[data-state=open]>svg]:rotate-180",
                    )}
                  >
                    <WorkoutInsightRowHeader
                      entry={entry}
                      dateLabel={dateLabel}
                      expandable
                    />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="overflow-hidden bg-muted/25 px-3 py-2 dark:bg-muted/50 data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up motion-reduce:animate-none">
                    <ul className="space-y-1">
                      {entry.subtasks.map((subtask) => (
                        <li
                          key={subtask.id}
                          className="flex items-center justify-between gap-2 text-xs"
                        >
                          <span className="truncate text-foreground">
                            {subtask.name.trim() || "Untitled exercise"}
                          </span>
                          <span className="shrink-0 text-muted-foreground">
                            {statusLabel(subtask.status)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </CollapsibleContent>
                </Collapsible>
              ) : (
                <div className="flex items-center gap-2 rounded-lg border border-border/70 bg-card px-3 py-2">
                  <WorkoutInsightRowHeader
                    entry={entry}
                    dateLabel={dateLabel}
                    expandable={false}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {hasMore && (
        <Button
          type="button"
          variant="outline"
          className="w-full"
          disabled={isLoadingMore}
          onClick={onLoadMore}
        >
          {isLoadingMore ? "Loading…" : "Load more"}
        </Button>
      )}
    </div>
  );
}
