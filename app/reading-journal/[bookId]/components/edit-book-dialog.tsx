"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { BookDetailView } from "@/lib/reading-journal-types";
import {
  BookDetailsFields,
  type BookDetailsFormValue,
} from "../../components/book-details-fields";
import type { BookPatch } from "../../hooks/use-book-detail";

interface EditBookDialogProps {
  book: BookDetailView;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (patch: BookPatch) => Promise<unknown>;
}

function formFromBook(book: BookDetailView): BookDetailsFormValue {
  return {
    title: book.title,
    author: book.author,
    totalPages: book.totalPages ? String(book.totalPages) : "",
    publishedYear: book.publishedYear ? String(book.publishedYear) : "",
    coverUrl: book.coverUrl,
  };
}

export function EditBookDialog({
  book,
  open,
  onOpenChange,
  onSave,
}: EditBookDialogProps) {
  const [form, setForm] = useState<BookDetailsFormValue>(() => formFromBook(book));
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) setForm(formFromBook(book));
  }, [open, book]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.title.trim()) return;

    setIsSaving(true);
    try {
      await onSave({
        title: form.title.trim(),
        author: form.author.trim(),
        coverUrl: form.coverUrl.trim(),
        totalPages: form.totalPages ? Number.parseInt(form.totalPages, 10) : null,
        publishedYear: form.publishedYear
          ? Number.parseInt(form.publishedYear, 10)
          : null,
      });
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(85vh,42rem)] flex-col overflow-hidden p-0 gap-0 sm:max-w-lg">
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <DialogHeader className="px-6 pt-6 pb-4">
            <DialogTitle>Edit details</DialogTitle>
            <DialogDescription>
              Update this book&rsquo;s information.
            </DialogDescription>
          </DialogHeader>
          <div className="scrollbar-themed min-h-0 flex-1 overflow-y-auto px-6 pb-6">
            <BookDetailsFields
              idPrefix="edit-book"
              value={form}
              onChange={setForm}
              openLibraryKey={book.openLibraryKey}
            />
          </div>
          <DialogFooter className="border-t px-6 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!form.title.trim() || isSaving}
              className="transition-transform duration-150 ease-out active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100"
            >
              Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
