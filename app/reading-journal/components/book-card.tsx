"use client";

import Link from "next/link";
import { BookOpen, BookMarked, Check, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRating, getProgressPercent } from "@/lib/reading-progress";
import {
  BOOK_STATUS_OPTIONS,
  type BookSummaryView,
} from "@/lib/reading-journal-types";
import { BookCoverImage } from "./book-cover-image";

interface BookCardProps {
  book: BookSummaryView;
}

function getStatusLabel(status: BookSummaryView["status"]): string {
  return BOOK_STATUS_OPTIONS.find((option) => option.value === status)?.label ?? status;
}

export function BookCard({ book }: BookCardProps) {
  const progressPercent =
    book.status === "reading"
      ? getProgressPercent(book.currentPage, book.totalPages)
      : null;

  const statusLabel = getStatusLabel(book.status);
  const pillLabel =
    book.status === "reading" && progressPercent !== null
      ? `${progressPercent}%`
      : statusLabel;

  return (
    <Link
      href={`/reading-journal/${book.id}`}
      className={cn(
        "group flex h-full w-[9.5rem] flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm sm:w-[10.5rem]",
        "transition-[transform,box-shadow] duration-200 ease-out",
        "active:scale-[0.99]",
        "[@media(hover:hover)_and_(pointer:fine)]:hover:shadow-md",
        "dark:border-border dark:bg-muted dark:shadow-[0_8px_24px_-6px_rgba(0,0,0,0.65)] dark:ring-1 dark:ring-white/[0.08]",
        "[@media(hover:hover)_and_(pointer:fine)]:dark:hover:shadow-[0_12px_28px_-6px_rgba(0,0,0,0.72)]",
        "motion-reduce:transition-none motion-reduce:active:scale-100"
      )}
    >
      <div className="px-3 pt-3">
        <div className="relative aspect-[2/3] w-full overflow-hidden rounded-md border border-border/80 bg-muted dark:border-border dark:bg-background/40">
          {book.coverUrl ? (
            <BookCoverImage
              src={book.coverUrl}
              alt=""
              sizes="(max-width: 640px) 152px, 168px"
              className={cn(
                "transition-transform duration-200 ease-out",
                "[@media(hover:hover)_and_(pointer:fine)]:group-hover:scale-[1.02]",
                "motion-reduce:transition-none motion-reduce:group-hover:scale-100"
              )}
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-3 text-center">
              <BookOpen className="size-7 text-muted-foreground/70" />
              <span className="line-clamp-3 text-[11px] font-medium leading-snug text-muted-foreground">
                {book.title}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col px-3 pb-2.5 pt-2">
        <div className="flex min-w-0 items-start gap-2">
          <h3 className="line-clamp-2 flex-1 text-sm font-bold leading-snug text-foreground">
            {book.title}
          </h3>
          {book.status === "finished" && (
            <span
              className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white"
              aria-label="Finished"
            >
              <Check className="size-3" strokeWidth={3} />
            </span>
          )}
        </div>

        <p
          className="mt-1 truncate text-sm text-muted-foreground"
          title={book.author || undefined}
        >
          {book.author || "Author unknown"}
        </p>

        <div className="mt-auto flex items-center justify-between gap-2 pt-3">
          <div className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
            {book.totalPages && book.currentPage !== null && (
              <span className="flex items-center gap-1 tabular-nums">
                <BookMarked className="size-3.5 shrink-0" aria-hidden />
                {book.currentPage}
              </span>
            )}
            {book.rating !== null && (
              <span className="flex items-center gap-1 tabular-nums">
                <Star className="size-3.5 shrink-0 fill-current text-muted-foreground" aria-hidden />
                {formatRating(book.rating)}
              </span>
            )}
          </div>

          <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-foreground">
            {pillLabel}
          </span>
        </div>
      </div>
    </Link>
  );
}
