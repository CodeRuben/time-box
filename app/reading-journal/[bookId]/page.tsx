"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FeatureGate } from "../../components/feature-gate";
import { BookInfoHeader } from "./components/book-info-header";
import { BookNotes } from "./components/book-notes";
import { EntriesSection } from "./components/entries-section";
import { ProgressBar } from "./components/progress-bar";
import { ReadingDaysGrid } from "./components/reading-days-grid";
import { useBookDetail } from "../hooks/use-book-detail";

function BookNotFoundCard() {
  return (
    <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Book not found</CardTitle>
            <CardDescription>
              This book doesn&rsquo;t exist or isn&rsquo;t in your journal.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/reading-journal">Back to all books</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function BookDetailContent({ bookId }: { bookId: string }) {
  const {
    isLoading,
    book,
    notFound,
    updateBook,
    updateNotes,
    isSavingNotes,
    notesSaved,
    tickDay,
    untickDay,
    deleteBook,
    saveEntry,
    deleteEntry,
  } = useBookDetail(bookId);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (notFound || !book) {
    return <BookNotFoundCard />;
  }

  return (
    <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-5xl">
        <Card className="gap-0 py-0 shadow-sm">
          <CardContent className="space-y-8 px-4 py-5 sm:px-6">
            <Link
              href="/reading-journal"
              className="inline-flex items-center gap-1 text-sm text-(color:--journal-muted-ink) hover:text-(color:--journal-ink)"
            >
              <ArrowLeft className="size-4" />
              All books
            </Link>

            <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_auto]">
              <BookInfoHeader book={book} onUpdate={updateBook} onDelete={deleteBook} />
              <ReadingDaysGrid
                readingDays={book.readingDays}
                onTick={tickDay}
                onUntick={untickDay}
              />
            </div>

            <ProgressBar currentPage={book.currentPage} totalPages={book.totalPages} />

            <div className="border-t border-border pt-8">
              <BookNotes
                notes={book.notes}
                onChange={updateNotes}
                isSaving={isSavingNotes}
                isSaved={notesSaved}
              />
            </div>

            <div className="border-t border-border pt-8">
              <EntriesSection
                entries={book.entries}
                latestKnownPage={book.currentPage}
                onSave={saveEntry}
                onDelete={deleteEntry}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function BookDetailPage() {
  const params = useParams<{ bookId: string }>();
  const bookId = Array.isArray(params.bookId) ? params.bookId[0] : params.bookId;

  return (
    <FeatureGate featureKey="reading-journal">
      <BookDetailContent bookId={bookId} />
    </FeatureGate>
  );
}
