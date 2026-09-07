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
import {
  BOOK_STATUS_OPTIONS,
  type BookDetailView,
  type BookTag,
} from "@/lib/reading-journal-types";
import { cn } from "@/lib/utils";
import type { BookPatch } from "../../hooks/use-book-detail";
import { BookCoverImage } from "../../components/book-cover-image";
import { BookTags } from "./book-tags";
import { DeleteBookAlert } from "./delete-book-alert";
import { EditBookDialog } from "./edit-book-dialog";
import { StarRating } from "./star-rating";

interface BookInfoHeaderProps {
  book: BookDetailView;
  onUpdate: (patch: BookPatch) => Promise<unknown>;
  onDelete: () => Promise<unknown>;
  onAddTag: (name: string) => Promise<void>;
  onRemoveTag: (tag: BookTag) => Promise<void>;
  isUpdatingTags: boolean;
}

const DATE_PICKER_CLASS =
  "h-8 w-full min-w-0 flex-1 truncate border-dashed px-2.5 text-xs sm:w-auto sm:flex-none sm:text-sm";

function parseLocalDate(value: string | null): Date | undefined {
  return value ? new Date(`${value}T00:00:00`) : undefined;
}

function BookStatusSelect({
  status,
  onUpdate,
  className,
}: {
  status: BookDetailView["status"];
  onUpdate: (patch: BookPatch) => Promise<unknown>;
  className?: string;
}) {
  return (
    <Select
      value={status}
      onValueChange={(value) => {
        const option = BOOK_STATUS_OPTIONS.find(
          (statusOption) => statusOption.value === value
        );
        if (option) void onUpdate({ status: option.value });
      }}
    >
      <SelectTrigger
        className={cn(
          "h-8 w-auto min-w-28 gap-1.5 px-2.5 text-sm",
          className
        )}
      >
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
  );
}

export function BookInfoHeader({
  book,
  onUpdate,
  onDelete,
  onAddTag,
  onRemoveTag,
  isUpdatingTags,
}: BookInfoHeaderProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const metadata = [
    book.publishedYear ? `${book.publishedYear}` : null,
    book.totalPages ? `${book.totalPages} pages` : null,
  ].filter(Boolean);

  return (
    <div className="grid grid-cols-[6rem_minmax(0,1fr)] items-start gap-x-4 gap-y-3 sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-x-6 sm:gap-y-4">
      <div className="sm:row-span-4">
        <div className="aspect-[2/3] overflow-hidden rounded-md border border-(--journal-border) bg-muted">
          {book.coverUrl ? (
            <BookCoverImage
              src={book.coverUrl}
              alt={book.title}
              sizes="(max-width: 640px) 96px, 144px"
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

      <div className="flex min-w-0 flex-col gap-3 sm:gap-4">
        <div className="space-y-1.5 sm:space-y-2">
          <div className="flex flex-wrap items-start gap-2 sm:gap-3">
            <h1 className="journal-heading min-w-0 flex-1 text-xl sm:text-2xl">
              {book.title}
            </h1>
            <BookStatusSelect
              status={book.status}
              onUpdate={onUpdate}
              className="order-last w-full sm:order-0 sm:w-auto"
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0"
                  aria-label="Book actions"
                >
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

          {book.author ? (
            <p className="text-(color:--journal-muted-ink)">{book.author}</p>
          ) : null}

          {metadata.length > 0 ? (
            <p className="text-sm text-(color:--journal-muted-ink)">
              {metadata.join(" · ")}
            </p>
          ) : null}
        </div>
      </div>

      <div className="col-span-2 flex min-w-0 items-center gap-2 sm:col-span-1">
        <DatePicker
          date={parseLocalDate(book.startedOn)}
          onSelect={(date) =>
            void onUpdate({
              startedOn: date ? format(date, "yyyy-MM-dd") : null,
            })
          }
          dateFormat="MMM d, yyyy"
          placeholder="Set start date"
          className={DATE_PICKER_CLASS}
        />
        <span className="shrink-0 text-(color:--journal-muted-ink)" aria-hidden>
          →
        </span>
        <DatePicker
          date={parseLocalDate(book.finishedOn)}
          onSelect={(date) =>
            void onUpdate({
              finishedOn: date ? format(date, "yyyy-MM-dd") : null,
            })
          }
          dateFormat="MMM d, yyyy"
          placeholder="Set finish date"
          className={DATE_PICKER_CLASS}
        />
      </div>

      <div className="col-span-2 sm:col-span-1">
        <StarRating
          rating={book.rating}
          onChange={(rating) => void onUpdate({ rating })}
        />
      </div>

      <div className="col-span-2 sm:col-span-1">
        <BookTags
          tags={book.tags}
          isUpdating={isUpdatingTags}
          onAdd={onAddTag}
          onRemove={onRemoveTag}
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
