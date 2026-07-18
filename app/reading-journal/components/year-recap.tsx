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
      className="mb-8 flex flex-col rounded-xl border border-border/70 bg-muted/30 sm:flex-row"
    >
      <div className="flex items-center justify-center px-6 py-5 sm:py-0">
        <p className="text-center">
          <span className="block text-2xl font-black tracking-tight text-foreground">
            {year}
          </span>
          <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Reading log
          </span>
        </p>
      </div>
      <div
        aria-hidden
        className="border-t border-dashed border-border sm:border-l sm:border-t-0"
      />
      <dl className="grid flex-1 grid-cols-2 gap-4 px-6 py-5 sm:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label}>
            <dt className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
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
