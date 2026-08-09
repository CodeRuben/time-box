"use client";

import {
  formatMonthKey,
  type WorkoutInsightMonthlyCount,
  type WorkoutInsightMostActiveMonth,
  type WorkoutType,
} from "@/lib/workout-insights";

interface WorkoutInsightsMonthlyTrendProps {
  monthlyCounts: WorkoutInsightMonthlyCount[];
  selectedTypes: WorkoutType[];
  mostActiveMonth: WorkoutInsightMostActiveMonth | null;
}

function monthTotal(
  row: WorkoutInsightMonthlyCount,
  selectedTypes: WorkoutType[],
): number {
  return selectedTypes.reduce((sum, type) => sum + row.counts[type], 0);
}

function formatMostActiveCallout(
  mostActiveMonth: WorkoutInsightMostActiveMonth | null,
): string {
  if (!mostActiveMonth) {
    return "No activity in this range";
  }

  const label = formatMonthKey(mostActiveMonth.monthKey, "MMM yyyy");
  const workoutLabel =
    mostActiveMonth.total === 1
      ? "1 workout"
      : `${mostActiveMonth.total} workouts`;
  return `Most active: ${label} · ${workoutLabel}`;
}

export function WorkoutInsightsMonthlyTrend({
  monthlyCounts,
  selectedTypes,
  mostActiveMonth,
}: WorkoutInsightsMonthlyTrendProps) {
  if (monthlyCounts.length === 0) {
    return null;
  }

  const totals = monthlyCounts.map((row) => monthTotal(row, selectedTypes));
  const maxTotal = Math.max(0, ...totals);
  const years = new Set(monthlyCounts.map((row) => row.monthKey.slice(0, 4)));
  const includeYear = years.size > 1;
  const scrollable = monthlyCounts.length > 12;

  return (
    <section className="rounded-lg border border-border/70 bg-muted/20 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground">Activity trend</h3>
        <p className="text-xs text-muted-foreground">
          {formatMostActiveCallout(mostActiveMonth)}
        </p>
      </div>

      <div className={scrollable ? "mt-4 overflow-x-auto" : "mt-4"}>
        <div
          className="flex h-36 items-end gap-2"
          style={
            scrollable
              ? { minWidth: `${monthlyCounts.length * 2.75}rem` }
              : undefined
          }
        >
          {monthlyCounts.map((row, index) => {
            const total = totals[index] ?? 0;
            const heightPercent =
              maxTotal > 0
                ? Math.max((total / maxTotal) * 100, total > 0 ? 8 : 0)
                : 0;
            const fullLabel = formatMonthKey(row.monthKey, "MMMM yyyy");
            const shortLabel = formatMonthKey(
              row.monthKey,
              includeYear ? "MMM yyyy" : "MMM",
            );
            const accessibleName = `${fullLabel}: ${total} ${
              total === 1 ? "workout" : "workouts"
            }`;

            return (
              <div
                key={row.monthKey}
                className="flex min-w-0 flex-1 flex-col items-center gap-2"
                style={scrollable ? { minWidth: "2.5rem" } : undefined}
              >
                <div
                  className="flex h-28 w-full items-end justify-center rounded-sm bg-muted/50 px-1"
                  title={accessibleName}
                >
                  <div
                    role="img"
                    aria-label={accessibleName}
                    className="w-full max-w-8 rounded-sm bg-primary/70"
                    style={{ height: `${heightPercent}%` }}
                  />
                </div>
                <span className="truncate text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  {shortLabel}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
