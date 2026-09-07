import { getBookYearRecap } from "@/lib/book-year-recap";
import type { BookSummaryView } from "@/lib/reading-journal-types";

interface YearRecapProps {
  books: BookSummaryView[];
  year: number;
}

function formatAverageRating(averageRating: number | null): string {
  if (averageRating === null) return "—";
  return `${averageRating.toFixed(2).replace(/\.?0+$/, "")} ★`;
}

function finishedLabel(count: number): string {
  return count === 1 ? "Book finished" : "Books finished";
}

export function YearRecap({ books, year }: YearRecapProps) {
  const recap = getBookYearRecap(books, year);
  const stats = [
    {
      label: finishedLabel(recap.finishedBooks),
      value: recap.finishedBooks.toLocaleString(),
    },
    { label: "Pages finished", value: recap.finishedPages.toLocaleString() },
    { label: "Avg rating", value: formatAverageRating(recap.averageRating) },
    { label: "Reading now", value: recap.currentlyReading.toLocaleString() },
  ];

  return (
    <section
      aria-label={`${year} reading recap`}
      className="mb-8 flex rounded-xl border border-border/70 bg-muted/30"
    >
      <div className="flex shrink-0 items-center justify-center px-3 py-4 sm:px-6">
        <p className="text-center">
          <span className="block text-xl font-black tracking-tight text-foreground sm:text-2xl">
            {year}
          </span>
          <span className="block whitespace-nowrap text-[10px] font-medium uppercase leading-tight tracking-[0.12em] text-muted-foreground sm:tracking-[0.18em]">
            Reading log
          </span>
        </p>
      </div>
      <div
        aria-hidden
        className="border-l border-dashed border-border"
      />
      <dl className="grid min-w-0 flex-1 grid-cols-2 gap-x-3 gap-y-4 px-3 py-4 text-center sm:grid-cols-4 sm:gap-4 sm:px-6 sm:py-5 sm:text-left">
        {stats.map((stat) => (
          <div key={stat.label} className="min-w-0">
            <dt className="text-[10px] font-medium uppercase leading-tight tracking-[0.14em] text-muted-foreground">
              {stat.label}
            </dt>
            <dd className="mt-1 text-lg font-semibold tabular-nums tracking-tight text-foreground">
              {stat.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
