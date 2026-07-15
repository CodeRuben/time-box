"use client";

import { useState } from "react";
import { format } from "date-fns";
import { BookOpen, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BOOK_STATUS_OPTIONS, type BookDetailView } from "@/lib/reading-journal-types";
import type { BookPatch } from "../../hooks/use-book-detail";
import { BookCoverImage } from "../../components/book-cover-image";
import { DeleteBookAlert } from "./delete-book-alert";
import { EditBookDialog } from "./edit-book-dialog";
import { StarRating } from "./star-rating";

interface BookInfoHeaderProps {
  book: BookDetailView;
  onUpdate: (patch: BookPatch) => Promise<unknown>;
  onDelete: () => Promise<unknown>;
}

function parseLocalDate(value: string | null): Date | undefined {
  return value ? new Date(`${value}T00:00:00`) : undefined;
}

export function BookInfoHeader({ book, onUpdate, onDelete }: BookInfoHeaderProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const metadata = [
    book.publishedYear ? `${book.publishedYear}` : null,
    book.totalPages ? `${book.totalPages} pages` : null,
  ].filter(Boolean);

  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:gap-6">
      <div className="w-28 shrink-0 sm:w-36">
        <div className="aspect-[2/3] overflow-hidden rounded-md border border-(--journal-border) bg-muted">
          {book.coverUrl ? (
            <BookCoverImage
              src={book.coverUrl}
              alt={book.title}
              sizes="(max-width: 640px) 112px, 144px"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-(--journal-border)/40 p-3 text-center">
              <BookOpen className="size-6 text-(color:--journal-muted-ink)" />
              <span className="line-clamp-3 text-xs font-medium text-(color:--journal-muted-ink)">
                {book.title}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <div className="space-y-2">
          <div className="flex items-start gap-2 sm:gap-3">
            <h1 className="journal-heading min-w-0 flex-1 text-xl sm:text-2xl">
              {book.title}
            </h1>
            <div className="flex shrink-0 items-center gap-1.5 pt-0.5">
              <Select
                value={book.status}
                onValueChange={(value) =>
                  void onUpdate({ status: value as BookDetailView["status"] })
                }
              >
                <SelectTrigger className="h-8 w-auto min-w-28 gap-1.5 px-2.5 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BOOK_STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Book actions">
                    <MoreHorizontal className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => setEditOpen(true)}>
                    Edit details
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    variant="destructive"
                    onSelect={() => setDeleteOpen(true)}
                  >
                    Delete book
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {book.author ? (
            <p className="text-(color:--journal-muted-ink)">{book.author}</p>
          ) : null}

          {metadata.length > 0 ? (
            <p className="text-sm text-(color:--journal-muted-ink)">
              {metadata.join(" · ")}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <DatePicker
            date={parseLocalDate(book.startedOn)}
            onSelect={(date) =>
              void onUpdate({
                startedOn: date ? format(date, "yyyy-MM-dd") : null,
              })
            }
            placeholder="Set start date"
            className="h-8 border-dashed px-2.5 text-sm"
          />
          <span className="text-(color:--journal-muted-ink)" aria-hidden>
            →
          </span>
          <DatePicker
            date={parseLocalDate(book.finishedOn)}
            onSelect={(date) =>
              void onUpdate({
                finishedOn: date ? format(date, "yyyy-MM-dd") : null,
              })
            }
            placeholder="Set finish date"
            className="h-8 border-dashed px-2.5 text-sm"
          />
        </div>

        <StarRating
          rating={book.rating}
          onChange={(rating) => void onUpdate({ rating })}
        />
      </div>

      <EditBookDialog
        book={book}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSave={onUpdate}
      />
      <DeleteBookAlert
        bookTitle={book.title}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={() => void onDelete()}
      />
    </div>
  );
}
