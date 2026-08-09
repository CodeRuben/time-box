"use client";

import { cn } from "@/lib/utils";
import {
  INSIGHT_WORKOUT_TYPE_META,
  formatMonthKey,
  type WorkoutInsightMonthlyCount,
  type WorkoutType,
} from "@/lib/workout-insights";

const TYPE_HEAT_CLASS: Record<WorkoutType, string[]> = {
  resistance: [
    "bg-blue-500/10 text-muted-foreground",
    "bg-blue-500/25 text-blue-800 dark:text-blue-200",
    "bg-blue-500/45 text-blue-900 dark:text-blue-100",
    "bg-blue-500/70 text-white",
  ],
  cardio: [
    "bg-teal-500/10 text-muted-foreground",
    "bg-teal-500/25 text-teal-800 dark:text-teal-200",
    "bg-teal-500/45 text-teal-900 dark:text-teal-100",
    "bg-teal-500/70 text-white",
  ],
  hybrid: [
    "bg-orange-500/10 text-muted-foreground",
    "bg-orange-500/25 text-orange-800 dark:text-orange-200",
    "bg-orange-500/45 text-orange-900 dark:text-orange-100",
    "bg-orange-500/70 text-white",
  ],
  unknown: [
    "bg-muted text-muted-foreground",
    "bg-muted-foreground/20 text-foreground",
    "bg-muted-foreground/35 text-foreground",
    "bg-muted-foreground/55 text-background",
  ],
};

function heatClass(
  type: WorkoutType,
  count: number,
  maxCount: number,
): string {
  if (count <= 0 || maxCount <= 0) {
    return "bg-muted/40 text-transparent";
  }

  const ratio = count / maxCount;
  const levels = TYPE_HEAT_CLASS[type];
  if (ratio < 0.34) {
    return levels[0];
  }
  if (ratio < 0.67) {
    return levels[1];
  }
  if (ratio < 1) {
    return levels[2];
  }
  return levels[3];
}

interface WorkoutInsightsMonthlyTableProps {
  monthlyCounts: WorkoutInsightMonthlyCount[];
  selectedTypes: WorkoutType[];
}

export function WorkoutInsightsMonthlyTable({
  monthlyCounts,
  selectedTypes,
}: WorkoutInsightsMonthlyTableProps) {
  if (monthlyCounts.length === 0) {
    return null;
  }

  const maxCount = Math.max(
    0,
    ...monthlyCounts.flatMap((row) =>
      selectedTypes.map((type) => row.counts[type]),
    ),
  );

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-foreground">Monthly breakdown</h3>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[28rem] border-separate border-spacing-1">
          <caption className="sr-only">
            Workout counts by type and month
          </caption>
          <thead>
            <tr>
              <th
                scope="col"
                className="px-1 pb-1 text-left text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground"
              >
                Type
              </th>
              {monthlyCounts.map((row) => (
                <th
                  key={row.monthKey}
                  scope="col"
                  className="px-1 pb-1 text-center text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground"
                >
                  {formatMonthKey(row.monthKey, "MMM")}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {selectedTypes.map((type) => (
              <tr key={type}>
                <th
                  scope="row"
                  className="whitespace-nowrap pr-2 text-left text-xs font-medium text-foreground"
                >
                  {INSIGHT_WORKOUT_TYPE_META[type].label}
                </th>
                {monthlyCounts.map((row) => {
                  const count = row.counts[type];

                  return (
                    <td key={row.monthKey} className="p-0">
                      <div
                        className={cn(
                          "flex h-9 items-center justify-center rounded-md text-xs font-semibold tabular-nums",
                          heatClass(type, count, maxCount),
                        )}
                        title={`${INSIGHT_WORKOUT_TYPE_META[type].label} · ${formatMonthKey(row.monthKey, "MMM yyyy")}: ${count}`}
                      >
                        {count > 0 ? count : "·"}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
