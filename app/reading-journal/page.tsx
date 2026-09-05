"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { FeatureGate } from "../components/feature-gate";
import { AddBookDialog } from "./components/add-book-dialog";
import { BookTagFilter } from "./components/book-tag-filter";
import { BookStatusSection } from "./components/book-status-section";
import { ManageBookTagsDialog } from "./components/manage-book-tags-dialog";
import { YearRecap } from "./components/year-recap";
import { useBookList } from "./hooks/use-book-list";
import type { BookSummaryView } from "@/lib/reading-journal-types";

function BookLogLists({
  filteredBooks,
  booksByStatus,
  clearTagFilters,
  onOpenTags,
}: {
  filteredBooks: BookSummaryView[];
  booksByStatus: ReturnType<typeof useBookList>["booksByStatus"];
  clearTagFilters: () => void;
  onOpenTags: (book: BookSummaryView) => void;
}) {
  if (filteredBooks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border py-16 text-center">
        <p className="text-muted-foreground">
          No books match the selected tags.
        </p>
        <Button variant="outline" onClick={clearTagFilters}>
          Clear filters
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <BookStatusSection
        title="Reading"
        books={booksByStatus.reading}
        onOpenTags={onOpenTags}
      />
      <BookStatusSection
        title="Finished"
        books={booksByStatus.finished}
        showFinishedOn
        onOpenTags={onOpenTags}
      />
      <BookStatusSection
        title="Abandoned"
        books={booksByStatus.abandoned}
        onOpenTags={onOpenTags}
      />
    </div>
  );
}

function ReadingJournalContent() {
  const {
    isLoading,
    books,
    filteredBooks,
    booksByStatus,
    availableTags,
    selectedTagKeys,
    toggleTagFilter,
    clearTagFilters,
    addTag,
    removeTag,
    updatingTagBookId,
    isCreating,
    addDialogOpen,
    setAddDialogOpen,
    createBook,
  } = useBookList();
  const [editingBookId, setEditingBookId] = useState<string | null>(null);
  const editingBook = books.find((book) => book.id === editingBookId) ?? null;

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 lg:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">
              Books
            </h1>
            <p className="mt-2 text-muted-foreground">
              Track what you read, day by day.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <BookTagFilter
              tags={availableTags}
              selectedKeys={selectedTagKeys}
              onToggle={toggleTagFilter}
              onClear={clearTagFilters}
            />
            <Button onClick={() => setAddDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              Add book
            </Button>
          </div>
        </div>

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
          <>
            <YearRecap books={books} year={new Date().getFullYear()} />
            <BookLogLists
              filteredBooks={filteredBooks}
              booksByStatus={booksByStatus}
              clearTagFilters={clearTagFilters}
              onOpenTags={(book) => setEditingBookId(book.id)}
            />
          </>
        )}
      </div>

      <AddBookDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onCreate={createBook}
        isCreating={isCreating}
      />
      <ManageBookTagsDialog
        open={editingBookId !== null}
        bookTitle={editingBook?.title ?? ""}
        tags={editingBook?.tags ?? []}
        isUpdating={updatingTagBookId === editingBookId}
        onOpenChange={(open) => {
          if (!open) setEditingBookId(null);
        }}
        onAdd={(name) =>
          editingBookId ? addTag(editingBookId, name) : Promise.resolve()
        }
        onRemove={(tag) =>
          editingBookId ? removeTag(editingBookId, tag) : Promise.resolve()
        }
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
