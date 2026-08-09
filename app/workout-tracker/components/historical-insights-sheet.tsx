"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  INSIGHT_WORKOUT_TYPE_META,
  type WorkoutInsightsSummary,
} from "@/lib/workout-insights";
import { useWorkoutInsights } from "../hooks/use-workout-insights";
import { WorkoutInsightsFilters } from "./workout-insights-filters";
import { WorkoutInsightsList } from "./workout-insights-list";
import { WorkoutInsightsMonthlyTable } from "./workout-insights-monthly-table";
import { WorkoutInsightsMonthlyTrend } from "./workout-insights-monthly-trend";

interface HistoricalInsightsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function WorkoutInsightsSummaryStats({
  summary,
}: {
  summary: WorkoutInsightsSummary;
}) {
  const mostFrequent = summary.mostFrequentType
    ? INSIGHT_WORKOUT_TYPE_META[summary.mostFrequentType.type].label
    : "—";

  const stats = [
    {
      label: "Workout entries",
      value: summary.totalWorkoutEntries.toLocaleString(),
    },
    {
      label: "Active days",
      value: summary.activeDays.toLocaleString(),
    },
    { label: "Most frequent", value: mostFrequent },
  ];

  return (
    <div className="flex divide-x divide-border/70 overflow-hidden rounded-lg border border-border/70 bg-card">
      {stats.map((stat) => (
        <div key={stat.label} className="min-w-0 flex-1 px-4 py-3">
          <p className="truncate text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            {stat.label}
          </p>
          <p className="mt-1 truncate text-2xl font-semibold tabular-nums tracking-tight text-foreground">
            {stat.value}
          </p>
        </div>
      ))}
    </div>
  );
}

function HistoricalInsightsBody() {
  const {
    today,
    preset,
    startDate,
    endDate,
    selectedTypes,
    summary,
    entries,
    totalEntries,
    hasMore,
    isInitialLoading,
    isRefreshing,
    isLoadingMore,
    error,
    applyPreset,
    applyCustomRange,
    toggleType,
    loadMore,
  } = useWorkoutInsights();

  return (
    <div className="space-y-6 p-4">
      <WorkoutInsightsFilters
        today={today}
        preset={preset}
        startDate={startDate}
        endDate={endDate}
        selectedTypes={selectedTypes}
        onSelectPreset={applyPreset}
        onSelectCustomRange={applyCustomRange}
        onToggleType={toggleType}
      />

      <WorkoutInsightsSummaryStats summary={summary} />

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      {isInitialLoading ? (
        <p className="text-sm text-muted-foreground">Loading insights…</p>
      ) : (
        <div
          className={cn(
            "space-y-6 transition-opacity duration-150 ease motion-reduce:transition-none",
            isRefreshing && "pointer-events-none opacity-60",
          )}
          aria-busy={isRefreshing || undefined}
        >
          <WorkoutInsightsMonthlyTrend
            monthlyCounts={summary.monthlyCounts}
            selectedTypes={selectedTypes}
            mostActiveMonth={summary.mostActiveMonth}
          />
          <WorkoutInsightsMonthlyTable
            monthlyCounts={summary.monthlyCounts}
            selectedTypes={selectedTypes}
          />
          <WorkoutInsightsList
            entries={entries}
            totalEntries={totalEntries}
            hasMore={hasMore}
            isLoadingMore={isLoadingMore}
            onLoadMore={() => {
              void loadMore();
            }}
          />
        </div>
      )}
    </div>
  );
}

export function HistoricalInsightsSheet({
  open,
  onOpenChange,
}: HistoricalInsightsSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="scrollbar-themed w-full gap-0 overflow-y-auto sm:max-w-4xl"
      >
        <SheetHeader className="border-b border-border/70">
          <SheetTitle className="text-xl">Workout Insights</SheetTitle>
          <SheetDescription className="sr-only">
            Workout totals and history for the selected date range.
          </SheetDescription>
        </SheetHeader>

        {open ? <HistoricalInsightsBody /> : null}
      </SheetContent>
    </Sheet>
  );
}
