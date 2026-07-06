import { BookCard } from "./book-card";
import type { BookSummaryView } from "@/lib/reading-journal-types";

interface BookStatusSectionProps {
  title: string;
  books: BookSummaryView[];
}

export function BookStatusSection({ title, books }: BookStatusSectionProps) {
  if (books.length === 0) {
    return null;
  }

  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold text-foreground">{title}</h2>
      <div className="flex flex-wrap gap-3">
        {books.map((book) => (
          <BookCard key={book.id} book={book} />
        ))}
      </div>
    </section>
  );
}
