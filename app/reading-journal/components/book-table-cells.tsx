"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { BookOpen, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRating } from "@/lib/reading-progress";
import {
  BOOK_STATUS_OPTIONS,
  type BookSummaryView,
} from "@/lib/reading-journal-types";
import type { BookSortColumn } from "@/lib/book-table-sort";
import { BookCoverImage } from "./book-cover-image";

export const SORT_COLUMNS: {
  value: BookSortColumn;
  label: string;
  headerClassName: string;
  align?: "left" | "right";
}[] = [
  {
    value: "title",
    label: "Book",
    headerClassName: "py-2 pl-1 pr-3 sm:pl-2",
  },
  {
    value: "author",
    label: "Author",
    headerClassName: "px-3 py-2",
  },
  {
    value: "progress",
    label: "Progress",
    headerClassName: "px-3 py-2",
  },
  {
    value: "rating",
    label: "Rating",
    headerClassName: "px-3 py-2",
  },
  {
    value: "tags",
    label: "Tags",
    headerClassName: "px-3 py-2",
  },
  {
    value: "startedOn",
    label: "Started",
    headerClassName: "px-3 py-2",
    align: "right",
  },
  {
    value: "finishedOn",
    label: "Finished",
    headerClassName: "px-3 py-2",
    align: "right",
  },
];

export const BOOK_ROW_INTERACTION_CLASS =
  "cursor-pointer transition-colors duration-150 ease-out [@media(hover:hover)_and_(pointer:fine)]:hover:bg-muted/50 focus-within:bg-muted/50 motion-reduce:transition-none";

export function visibleSortColumns(showFinishedOn: boolean) {
  return SORT_COLUMNS.filter(
    (column) => column.value !== "finishedOn" || showFinishedOn
  );
}

export function isBookSortColumn(value: string): value is BookSortColumn {
  return SORT_COLUMNS.some((column) => column.value === value);
}

export function getStatusLabel(status: BookSummaryView["status"]): string {
  return (
    BOOK_STATUS_OPTIONS.find((option) => option.value === status)?.label ??
    status
  );
}

function formatPagePosition(book: BookSummaryView): string | null {
  if (book.currentPage !== null && book.totalPages) {
    return `${book.currentPage} / ${book.totalPages}`;
  }
  if (book.currentPage !== null) {
    return `p. ${book.currentPage}`;
  }
  return null;
}

export function getProgressDetail(book: BookSummaryView): string {
  return formatPagePosition(book) ?? getStatusLabel(book.status);
}

export function getPageCountLabel(book: BookSummaryView): string | null {
  return (
    formatPagePosition(book) ??
    (book.totalPages ? `${book.totalPages} p.` : null)
  );
}

export function formatShortDate(value: string | null): string {
  if (!value) return "—";
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return "—";
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function bookHref(bookId: string): string {
  return `/reading-journal/${bookId}`;
}

export function BookCoverThumb({
  book,
  className,
}: {
  book: BookSummaryView;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "relative h-11 w-[1.85rem] shrink-0 overflow-hidden rounded-sm border border-border/70 bg-muted shadow-sm",
        "dark:border-border dark:bg-background/40 dark:shadow-none",
        "ring-1 ring-black/[0.03] dark:ring-white/[0.06]",
        className
      )}
    >
      {book.coverUrl ? (
        <BookCoverImage src={book.coverUrl} alt="" sizes="40px" />
      ) : (
        <span className="flex h-full w-full items-center justify-center">
          <BookOpen className="size-3 text-muted-foreground/70" />
        </span>
      )}
    </span>
  );
}

export function RatingBadge({
  rating,
  variant = "badge",
}: {
  rating: number | null;
  variant?: "badge" | "compact";
}) {
  if (rating === null) {
    return variant === "compact" ? null : (
      <span className="text-xs text-muted-foreground/50">—</span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center tabular-nums text-foreground",
        variant === "badge"
          ? "gap-1 rounded-full bg-muted/80 px-2 py-0.5 text-xs font-medium"
          : "gap-0.5 text-xs"
      )}
    >
      <Star className="size-3 shrink-0" aria-hidden />
      {formatRating(rating)}
    </span>
  );
}

export function TagsButton({
  book,
  onOpenTags,
  labeled = false,
}: {
  book: BookSummaryView;
  onOpenTags: (book: BookSummaryView) => void;
  labeled?: boolean;
}) {
  const count = book.tags.length;
  const label = count === 1 ? "1 tag" : `${count} tags`;

  return (
    <button
      type="button"
      className={cn(
        "relative z-10 inline-flex cursor-pointer items-center outline-none focus-visible:ring-2 focus-visible:ring-ring",
        labeled
          ? "min-h-8 text-xs font-medium tabular-nums text-muted-foreground hover:text-foreground"
          : "rounded-full bg-muted/80 px-2 py-0.5 text-xs font-medium tabular-nums text-foreground hover:bg-muted"
      )}
      aria-label={label}
      onClick={(event) => {
        event.stopPropagation();
        onOpenTags(book);
      }}
    >
      {labeled ? label : count}
    </button>
  );
}

export function BookRowTitleLink({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "min-w-0 text-sm font-semibold tracking-tight text-foreground",
        "after:absolute after:inset-0 focus-visible:relative focus-visible:z-10",
        className
      )}
    >
      {children}
    </Link>
  );
}
