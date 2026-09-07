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
      className="mb-8 rounded-xl border border-border/70 bg-muted/30 px-4 py-4 sm:flex sm:px-0 sm:py-0"
    >
      <p className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 sm:shrink-0 sm:flex-col sm:items-center sm:justify-center sm:px-6 sm:py-5 sm:text-center">
        <span className="text-xl font-black tracking-tight text-foreground sm:text-2xl">
          {year}
        </span>
        <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground sm:mt-0.5 sm:leading-tight">
          Reading log
        </span>
      </p>
      <div
        aria-hidden
        className="my-3 border-t border-dashed border-border sm:my-0 sm:border-t-0 sm:border-l"
      />
      <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:min-w-0 sm:flex-1 sm:grid-cols-4 sm:gap-4 sm:px-6 sm:py-5">
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
