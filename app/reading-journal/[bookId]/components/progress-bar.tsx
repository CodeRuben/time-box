import { getProgressPercent } from "@/lib/reading-progress";
import { cn } from "@/lib/utils";

interface ProgressBarProps {
  currentPage: number | null;
  totalPages: number | null;
}

const MILESTONES = [
  { end: 10, label: "Great start" },
  { end: 40, label: "Keep going" },
  { end: 70, label: "Almost there" },
  { end: 100, label: "You did it" },
] as const;

export function ProgressBar({ currentPage, totalPages }: ProgressBarProps) {
  const percent = getProgressPercent(currentPage, totalPages);

  return (
    <section className="space-y-3">
      <h2 className="journal-heading text-sm">Progress</h2>
      {percent === null ? (
        <p className="text-sm text-(color:--journal-muted-ink)">
          {totalPages === null
            ? "Set total pages to track progress."
            : "Log an entry with your current page to track progress."}
        </p>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-(color:--journal-muted-ink)">
            Page{" "}
            <span className="font-medium text-(color:--journal-ink) tabular-nums">
              {currentPage}
            </span>{" "}
            of{" "}
            <span className="font-medium text-(color:--journal-ink) tabular-nums">
              {totalPages}
            </span>
            <span className="text-(color:--journal-muted-ink)"> · </span>
            <span className="tabular-nums text-(color:--journal-ink)">{percent}%</span>
          </p>

          <div className="space-y-3">
            <div
              role="progressbar"
              aria-valuenow={percent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${percent}% complete`}
              className="h-2 w-full overflow-hidden rounded-sm bg-(--journal-border)/40"
            >
              <div
                className="h-full w-full origin-left rounded-sm bg-(--journal-rose) transition-transform duration-200 ease-out motion-reduce:transition-none"
                style={{ transform: `scaleX(${percent / 100})` }}
              />
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              {MILESTONES.map((milestone, index) => {
                const start = index === 0 ? 0 : MILESTONES[index - 1].end;
                const complete = percent >= milestone.end;
                const started = percent > start;

                return (
                  <div key={milestone.end} className="space-y-0.5 text-center">
                    <p
                      className={cn(
                        "text-[0.65rem] font-medium tabular-nums sm:text-xs",
                        complete || started
                          ? "text-(color:--journal-rose)"
                          : "text-(color:--journal-muted-ink)"
                      )}
                    >
                      {milestone.end}%
                    </p>
                    <p
                      className={cn(
                        "text-[0.6rem] leading-tight sm:text-[0.65rem]",
                        complete
                          ? "font-medium text-(color:--journal-ink)"
                          : "text-(color:--journal-muted-ink)"
                      )}
                    >
                      {milestone.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
