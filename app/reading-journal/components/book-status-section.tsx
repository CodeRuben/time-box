import type { BookSummaryView } from "@/lib/reading-journal-types";
import { BookTable } from "./book-table";

interface BookStatusSectionProps {
  title: string;
  books: BookSummaryView[];
  showFinishedOn?: boolean;
  onOpenTags: (book: BookSummaryView) => void;
}

export function BookStatusSection({
  title,
  books,
  showFinishedOn = false,
  onOpenTags,
}: BookStatusSectionProps) {
  if (books.length === 0) {
    return null;
  }

  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold text-foreground">{title}</h2>
      <BookTable
        books={books}
        showFinishedOn={showFinishedOn}
        onOpenTags={onOpenTags}
      />
    </section>
  );
}
