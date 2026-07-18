"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { FeatureGate } from "../components/feature-gate";
import { AddBookDialog } from "./components/add-book-dialog";
import { BookStatusSection } from "./components/book-status-section";
import { YearRecap } from "./components/year-recap";
import { useBookList } from "./hooks/use-book-list";

function ReadingJournalContent() {
  const {
    isLoading,
    books,
    booksByStatus,
    isCreating,
    addDialogOpen,
    setAddDialogOpen,
    createBook,
  } = useBookList();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 lg:mb-8 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">
              Book log
            </h1>
            <p className="mt-2 text-muted-foreground">
              Track what you read, day by day.
            </p>
          </div>
          <Button onClick={() => setAddDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Add book
          </Button>
        </div>

        {books.length > 0 && (
          <YearRecap books={books} year={new Date().getFullYear()} />
        )}

        {books.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border py-16 text-center">
            <p className="text-muted-foreground">
              Track what you read, day by day.
            </p>
            <Button onClick={() => setAddDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              Add your first book
            </Button>
          </div>
        ) : (
          <div className="space-y-8">
            <BookStatusSection title="Reading" books={booksByStatus.reading} />
            <BookStatusSection
              title="Finished"
              books={booksByStatus.finished}
              showFinishedOn
            />
            <BookStatusSection title="Abandoned" books={booksByStatus.abandoned} />
          </div>
        )}
      </div>

      <AddBookDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onCreate={createBook}
        isCreating={isCreating}
      />
    </div>
  );
}

export default function ReadingJournalPage() {
  return (
    <FeatureGate featureKey="reading-journal">
      <ReadingJournalContent />
    </FeatureGate>
  );
}
