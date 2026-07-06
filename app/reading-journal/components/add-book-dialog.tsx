"use client";

import { useState } from "react";
import { BookOpen, ChevronLeft } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { BookSearchResult } from "@/lib/book-search";
import type { CreateBookInput } from "../hooks/use-book-list";
import { useBookSearch } from "../hooks/use-book-search";
import {
  BookDetailsFields,
  EMPTY_BOOK_DETAILS_FORM,
  type BookDetailsFormValue,
} from "./book-details-fields";
import { BookCoverImage } from "./book-cover-image";

interface AddBookDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (input: CreateBookInput) => Promise<unknown>;
  isCreating: boolean;
}

interface FormState extends BookDetailsFormValue {
  openLibraryKey: string;
}

const EMPTY_FORM: FormState = {
  ...EMPTY_BOOK_DETAILS_FORM,
  openLibraryKey: "",
};

function formFromSearchResult(result: BookSearchResult): FormState {
  return {
    title: result.title,
    author: result.author,
    totalPages: result.totalPages ? String(result.totalPages) : "",
    publishedYear: result.publishedYear ? String(result.publishedYear) : "",
    coverUrl: result.coverUrl,
    openLibraryKey: result.openLibraryKey,
  };
}

export function AddBookDialog({
  open,
  onOpenChange,
  onCreate,
  isCreating,
}: AddBookDialogProps) {
  const [step, setStep] = useState<"search" | "form">("search");
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const { query, setQuery, results, isSearching, searchFailed } = useBookSearch();

  const resetAndClose = () => {
    setStep("search");
    setForm(EMPTY_FORM);
    setQuery("");
    onOpenChange(false);
  };

  const handleSelectResult = (result: BookSearchResult) => {
    setForm(formFromSearchResult(result));
    setStep("form");
  };

  const handleManualAdd = () => {
    setForm(EMPTY_FORM);
    setStep("form");
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.title.trim()) return;

    await onCreate({
      title: form.title.trim(),
      author: form.author.trim(),
      coverUrl: form.coverUrl.trim(),
      totalPages: form.totalPages ? Number.parseInt(form.totalPages, 10) : null,
      publishedYear: form.publishedYear
        ? Number.parseInt(form.publishedYear, 10)
        : null,
      openLibraryKey: form.openLibraryKey,
    });
    resetAndClose();
  };

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : resetAndClose())}>
      <DialogContent className="flex max-h-[min(85vh,42rem)] flex-col overflow-hidden p-0 gap-0 sm:max-w-lg">
        {step === "search" ? (
          <>
            <DialogHeader className="px-6 pt-6 pb-4">
              <DialogTitle>Add a book</DialogTitle>
              <DialogDescription>
                Search by title or author, or add the details yourself.
              </DialogDescription>
            </DialogHeader>

            <div className="scrollbar-themed min-h-0 flex-1 overflow-y-auto px-6 pb-6">
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by title or author…"
                autoFocus
              />

              <div className="mt-4 space-y-1">
                {isSearching && (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    Searching…
                  </p>
                )}

                {!isSearching && searchFailed && (
                  <p className="py-2 text-sm text-muted-foreground">
                    Search unavailable — add the book manually.
                  </p>
                )}

                {!isSearching &&
                  !searchFailed &&
                  results.map((result) => (
                    <button
                      key={result.openLibraryKey}
                      type="button"
                      onClick={() => handleSelectResult(result)}
                      className="flex w-full items-center gap-3 rounded-md p-2 text-left transition-colors duration-150 ease hover:bg-accent motion-reduce:transition-none"
                    >
                      <div className="relative flex h-14 w-10 shrink-0 items-center justify-center overflow-hidden rounded-sm bg-muted">
                        {result.coverUrl ? (
                          <BookCoverImage
                            src={result.coverUrl}
                            alt={result.title}
                            sizes="40px"
                          />
                        ) : (
                          <BookOpen className="size-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-1 text-sm font-medium">
                          {result.title}
                        </p>
                        <p className="line-clamp-1 text-xs text-muted-foreground">
                          {[result.author, result.publishedYear].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                    </button>
                  ))}
              </div>

              <Button
                type="button"
                variant="link"
                className="mt-2 h-auto p-0 text-sm"
                onClick={handleManualAdd}
              >
                Can&rsquo;t find it? Add manually
              </Button>
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
            <DialogHeader className="px-6 pt-6 pb-4">
              <DialogTitle>Book details</DialogTitle>
              <DialogDescription>
                Edit anything before adding it to your journal.
              </DialogDescription>
            </DialogHeader>

            <div className="scrollbar-themed min-h-0 flex-1 overflow-y-auto px-6 pb-6">
              <BookDetailsFields
                idPrefix="add-book"
                value={form}
                onChange={(next) => setForm((prev) => ({ ...prev, ...next }))}
                openLibraryKey={form.openLibraryKey}
              />
            </div>

            <DialogFooter className="border-t px-6 py-4 sm:justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep("search")}
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>
              <Button
                type="submit"
                disabled={!form.title.trim() || isCreating}
                className="transition-transform duration-150 ease-out active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100"
              >
                Add book
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
