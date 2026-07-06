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
    <div className="flex flex-col gap-4 sm:flex-row">
      <div className="w-32 shrink-0 sm:w-40">
        <div className="aspect-[2/3] overflow-hidden rounded-md border border-(--journal-border) bg-muted">
          {book.coverUrl ? (
            <BookCoverImage
              src={book.coverUrl}
              alt={book.title}
              sizes="(max-width: 640px) 128px, 160px"
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

      <div className="flex-1 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h1 className="journal-heading text-xl sm:text-2xl">{book.title}</h1>
            {book.author && (
              <p className="mt-1 text-(color:--journal-muted-ink)">{book.author}</p>
            )}
          </div>
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

        {metadata.length > 0 && (
          <p className="text-sm text-(color:--journal-muted-ink)">
            {metadata.join(" · ")}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <Select
            value={book.status}
            onValueChange={(value) => void onUpdate({ status: value as BookDetailView["status"] })}
          >
            <SelectTrigger className="w-40">
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

          <DatePicker
            date={parseLocalDate(book.startedOn)}
            onSelect={(date) =>
              void onUpdate({
                startedOn: date ? format(date, "yyyy-MM-dd") : null,
              })
            }
            placeholder="Started"
          />
          <DatePicker
            date={parseLocalDate(book.finishedOn)}
            onSelect={(date) =>
              void onUpdate({
                finishedOn: date ? format(date, "yyyy-MM-dd") : null,
              })
            }
            placeholder="Finished"
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
