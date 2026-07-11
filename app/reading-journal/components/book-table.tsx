"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, ArrowUpDown, BookOpen, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  sortBooks,
  type BookSortColumn,
  type BookSortDirection,
} from "@/lib/book-table-sort";
import {
  BOOK_TABLE_PAGE_SIZE,
  getPageCount,
  getPaginationItems,
  paginateItems,
} from "@/lib/book-table-pagination";
import { formatRating, getProgressPercent } from "@/lib/reading-progress";
import {
  BOOK_STATUS_OPTIONS,
  type BookSummaryView,
} from "@/lib/reading-journal-types";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { BookCoverImage } from "./book-cover-image";

interface BookTableProps {
  books: BookSummaryView[];
  showFinishedOn?: boolean;
}

function getStatusLabel(status: BookSummaryView["status"]): string {
  return BOOK_STATUS_OPTIONS.find((option) => option.value === status)?.label ?? status;
}

function getProgressPercentLabel(book: BookSummaryView): string | null {
  if (book.status !== "reading") return null;
  const percent = getProgressPercent(book.currentPage, book.totalPages);
  return percent !== null ? `${percent}%` : null;
}

function getProgressDetail(book: BookSummaryView): string {
  if (book.currentPage !== null && book.totalPages) {
    return `${book.currentPage} / ${book.totalPages}`;
  }
  if (book.currentPage !== null) {
    return `p. ${book.currentPage}`;
  }
  return getStatusLabel(book.status);
}

function formatShortDate(value: string | null): string {
  if (!value) return "—";
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return "—";
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function ProgressMeter({ book }: { book: BookSummaryView }) {
  const percentLabel = getProgressPercentLabel(book);
  const detail = getProgressDetail(book);
  const label = percentLabel ?? detail;

  return (
    <span className="inline-flex items-center rounded-full bg-muted/80 px-2 py-0.5 text-xs font-medium tabular-nums text-foreground">
      {label}
      {percentLabel && detail !== percentLabel && (
        <span className="ml-1.5 font-normal text-muted-foreground">
          {detail}
        </span>
      )}
    </span>
  );
}

function SortIcon({
  active,
  direction,
}: {
  active: boolean;
  direction: BookSortDirection;
}) {
  if (!active) {
    return <ArrowUpDown className="size-3 opacity-40" aria-hidden />;
  }

  return direction === "asc" ? (
    <ArrowUp className="size-3" aria-hidden />
  ) : (
    <ArrowDown className="size-3" aria-hidden />
  );
}

function SortableHeader({
  label,
  column,
  activeColumn,
  direction,
  onSort,
  className,
  align = "left",
}: {
  label: string;
  column: BookSortColumn;
  activeColumn: BookSortColumn;
  direction: BookSortDirection;
  onSort: (column: BookSortColumn) => void;
  className?: string;
  align?: "left" | "right";
}) {
  const active = activeColumn === column;

  return (
    <th
      aria-sort={
        active ? (direction === "asc" ? "ascending" : "descending") : "none"
      }
      className={cn("pb-0", align === "right" && "text-right", className)}
    >
      <button
        type="button"
        onClick={() => onSort(column)}
        className={cn(
          "inline-flex cursor-pointer items-center gap-1 text-[11px] font-medium uppercase tracking-[0.14em]",
          "text-muted-foreground transition-colors duration-150 ease-out",
          "[@media(hover:hover)_and_(pointer:fine)]:hover:text-foreground",
          "focus-visible:outline-none focus-visible:text-foreground",
          active && "text-foreground",
          align === "right" && "w-full justify-end",
          "motion-reduce:transition-none"
        )}
      >
        {label}
        <SortIcon active={active} direction={direction} />
      </button>
    </th>
  );
}

function BookTableRow({
  book,
  showFinishedOn,
}: {
  book: BookSummaryView;
  showFinishedOn: boolean;
}) {
  const router = useRouter();
  const href = `/reading-journal/${book.id}`;

  return (
    <tr
      tabIndex={0}
      role="link"
      onClick={() => router.push(href)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          router.push(href);
        }
      }}
      className="cursor-pointer transition-colors duration-150 ease-out [@media(hover:hover)_and_(pointer:fine)]:hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none motion-reduce:transition-none"
    >
      <td className="py-2 pl-1 pr-3 sm:pl-2">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={cn(
              "relative h-11 w-[1.85rem] shrink-0 overflow-hidden rounded-sm border border-border/70 bg-muted shadow-sm",
              "dark:border-border dark:bg-background/40 dark:shadow-none",
              "ring-1 ring-black/[0.03] dark:ring-white/[0.06]"
            )}
          >
            {book.coverUrl ? (
              <BookCoverImage src={book.coverUrl} alt="" sizes="30px" />
            ) : (
              <span className="flex h-full w-full items-center justify-center">
                <BookOpen className="size-3 text-muted-foreground/70" />
              </span>
            )}
          </span>
          <div className="min-w-0">
            <Link
              href={href}
              className="block truncate text-sm font-semibold tracking-tight text-foreground"
              onClick={(event) => event.stopPropagation()}
            >
              {book.title}
            </Link>
            <p className="truncate text-xs text-muted-foreground sm:hidden">
              {book.author || "Author unknown"}
            </p>
          </div>
        </div>
      </td>
      <td className="hidden max-w-[12rem] truncate px-3 py-2 text-sm text-muted-foreground sm:table-cell">
        {book.author || "Author unknown"}
      </td>
      <td className="px-3 py-2">
        <ProgressMeter book={book} />
      </td>
      <td className="px-3 py-2">
        {book.rating !== null ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-muted/80 px-2 py-0.5 text-xs font-medium tabular-nums text-foreground">
            <Star className="size-3 shrink-0" aria-hidden />
            {formatRating(book.rating)}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground/50">—</span>
        )}
      </td>
      <td className="hidden whitespace-nowrap px-3 py-2 text-right text-xs tabular-nums text-muted-foreground md:table-cell">
        {formatShortDate(book.startedOn)}
      </td>
      {showFinishedOn && (
        <td className="hidden whitespace-nowrap px-3 py-2 text-right text-xs tabular-nums text-muted-foreground md:table-cell">
          {formatShortDate(book.finishedOn)}
        </td>
      )}
    </tr>
  );
}

export function BookTable({ books, showFinishedOn = false }: BookTableProps) {
  const [column, setColumn] = useState<BookSortColumn>("title");
  const [direction, setDirection] = useState<BookSortDirection>("asc");
  const [page, setPage] = useState(1);

  function handleSort(nextColumn: BookSortColumn) {
    if (nextColumn === column) {
      setDirection((current) => (current === "asc" ? "desc" : "asc"));
    } else {
      setColumn(nextColumn);
      setDirection(
        nextColumn === "rating" ||
          nextColumn === "startedOn" ||
          nextColumn === "finishedOn"
          ? "desc"
          : "asc"
      );
    }
    setPage(1);
  }

  const sortedBooks = sortBooks(books, column, direction);
  const pageCount = getPageCount(sortedBooks.length, BOOK_TABLE_PAGE_SIZE);
  const currentPage = Math.min(page, pageCount);
  const pageItems = paginateItems(
    sortedBooks,
    currentPage,
    BOOK_TABLE_PAGE_SIZE
  );
  const paginationItems = getPaginationItems(currentPage, pageCount);

  useEffect(() => {
    if (page > pageCount) {
      setPage(pageCount);
    }
  }, [page, pageCount]);

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[28rem] border-collapse text-left">
          <thead>
            <tr className="border-b border-border/70">
              <SortableHeader
                label="Book"
                column="title"
                activeColumn={column}
                direction={direction}
                onSort={handleSort}
                className="py-2 pl-1 pr-3 sm:pl-2"
              />
              <SortableHeader
                label="Author"
                column="author"
                activeColumn={column}
                direction={direction}
                onSort={handleSort}
                className="hidden px-3 py-2 sm:table-cell"
              />
              <SortableHeader
                label="Progress"
                column="progress"
                activeColumn={column}
                direction={direction}
                onSort={handleSort}
                className="px-3 py-2"
              />
              <SortableHeader
                label="Rating"
                column="rating"
                activeColumn={column}
                direction={direction}
                onSort={handleSort}
                className="px-3 py-2"
              />
              <SortableHeader
                label="Started"
                column="startedOn"
                activeColumn={column}
                direction={direction}
                onSort={handleSort}
                className="hidden px-3 py-2 md:table-cell"
                align="right"
              />
              {showFinishedOn && (
                <SortableHeader
                  label="Finished"
                  column="finishedOn"
                  activeColumn={column}
                  direction={direction}
                  onSort={handleSort}
                  className="hidden px-3 py-2 md:table-cell"
                  align="right"
                />
              )}
            </tr>
          </thead>
          <tbody className="[&_tr]:border-b [&_tr]:border-border/50 [&_tr:last-child]:border-b-0">
            {pageItems.map((book) => (
              <BookTableRow
                key={book.id}
                book={book}
                showFinishedOn={showFinishedOn}
              />
            ))}
          </tbody>
        </table>
      </div>

      {pageCount > 1 && (
        <Pagination className="justify-end">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={currentPage <= 1}
              />
            </PaginationItem>
            {paginationItems.map((item, index) =>
              item === "ellipsis" ? (
                <PaginationItem key={`ellipsis-${index}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={item}>
                  <PaginationLink
                    isActive={item === currentPage}
                    onClick={() => setPage(item)}
                  >
                    {item}
                  </PaginationLink>
                </PaginationItem>
              )
            )}
            <PaginationItem>
              <PaginationNext
                onClick={() =>
                  setPage((current) => Math.min(pageCount, current + 1))
                }
                disabled={currentPage >= pageCount}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
