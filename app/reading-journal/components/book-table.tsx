"use client";

import { useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  sortBooks,
  type BookSortColumn,
  type BookSortDirection,
} from "@/lib/book-table-sort";
import {
  BOOK_TABLE_PAGE_SIZE,
  BOOK_TABLE_PAGE_SIZE_OPTIONS,
  getPageCount,
  getVisibleBookRange,
  paginateItems,
  parseBookTablePageSize,
  type BookTablePageSize,
} from "@/lib/book-table-pagination";
import { getProgressPercent } from "@/lib/reading-progress";
import type { BookSummaryView } from "@/lib/reading-journal-types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BookMobileList } from "./book-mobile-list";
import {
  BOOK_ROW_INTERACTION_CLASS,
  BookCoverThumb,
  BookRowTitleLink,
  RatingBadge,
  TagsButton,
  bookHref,
  formatShortDate,
  getProgressDetail,
  visibleSortColumns,
} from "./book-table-cells";

interface BookTableProps {
  books: BookSummaryView[];
  showFinishedOn?: boolean;
  onOpenTags: (book: BookSummaryView) => void;
}

function getProgressPercentLabel(book: BookSummaryView): string | null {
  if (book.status !== "reading") return null;
  const percent = getProgressPercent(book.currentPage, book.totalPages);
  return percent !== null ? `${percent}%` : null;
}

function ProgressMeter({ book }: { book: BookSummaryView }) {
  const percentLabel = getProgressPercentLabel(book);
  const detail = getProgressDetail(book);
  const label = percentLabel ?? detail;

  return (
    <span className="inline-flex max-w-full flex-wrap items-center rounded-full bg-muted/80 px-2 py-0.5 text-xs font-medium tabular-nums text-foreground">
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
  onOpenTags,
}: {
  book: BookSummaryView;
  showFinishedOn: boolean;
  onOpenTags: (book: BookSummaryView) => void;
}) {
  const href = bookHref(book.id);

  return (
    <tr className={cn("relative", BOOK_ROW_INTERACTION_CLASS)}>
      <td className="py-2 pl-1 pr-3 sm:pl-2">
        <div className="flex min-w-0 items-center gap-3">
          <BookCoverThumb book={book} />
          <BookRowTitleLink href={href} className="block truncate">
            {book.title}
          </BookRowTitleLink>
        </div>
      </td>
      <td className="max-w-[12rem] truncate px-3 py-2 text-sm text-muted-foreground">
        {book.author || "Author unknown"}
      </td>
      <td className="px-3 py-2">
        <ProgressMeter book={book} />
      </td>
      <td className="px-3 py-2">
        <RatingBadge rating={book.rating} />
      </td>
      <td className="px-3 py-2">
        <TagsButton book={book} onOpenTags={onOpenTags} />
      </td>
      <td className="whitespace-nowrap px-3 py-2 text-right text-xs tabular-nums text-muted-foreground">
        {formatShortDate(book.startedOn)}
      </td>
      {showFinishedOn && (
        <td className="whitespace-nowrap px-3 py-2 text-right text-xs tabular-nums text-muted-foreground">
          {formatShortDate(book.finishedOn)}
        </td>
      )}
    </tr>
  );
}

export function BookTable({
  books,
  showFinishedOn = false,
  onOpenTags,
}: BookTableProps) {
  const [column, setColumn] = useState<BookSortColumn>(
    showFinishedOn ? "finishedOn" : "title"
  );
  const [direction, setDirection] = useState<BookSortDirection>(
    showFinishedOn ? "desc" : "asc"
  );
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<BookTablePageSize>(BOOK_TABLE_PAGE_SIZE);

  function handleSort(nextColumn: BookSortColumn) {
    if (nextColumn === column) {
      setDirection((current) => (current === "asc" ? "desc" : "asc"));
    } else {
      setColumn(nextColumn);
      setDirection(
        nextColumn === "rating" ||
          nextColumn === "tags" ||
          nextColumn === "startedOn" ||
          nextColumn === "finishedOn"
          ? "desc"
          : "asc"
      );
    }
    setPage(1);
  }

  function handlePageSizeChange(value: string) {
    const nextSize = parseBookTablePageSize(value);
    if (nextSize === null) return;
    setPageSize(nextSize);
    setPage(1);
  }

  const sortedBooks = sortBooks(books, column, direction);
  const pageCount = getPageCount(sortedBooks.length, pageSize);
  const currentPage = Math.min(page, pageCount);
  const pageItems = paginateItems(sortedBooks, currentPage, pageSize);
  const { first: firstVisibleBook, last: lastVisibleBook } = getVisibleBookRange(
    sortedBooks.length,
    currentPage,
    pageSize
  );
  const headers = visibleSortColumns(showFinishedOn);

  return (
    <div className="space-y-4">
      <BookMobileList
        books={pageItems}
        showFinishedOn={showFinishedOn}
        onOpenTags={onOpenTags}
        column={column}
        direction={direction}
        onSort={handleSort}
      />

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-border/70">
              {headers.map((header) => (
                <SortableHeader
                  key={header.value}
                  label={header.label}
                  column={header.value}
                  activeColumn={column}
                  direction={direction}
                  onSort={handleSort}
                  className={header.headerClassName}
                  align={header.align}
                />
              ))}
            </tr>
          </thead>
          <tbody className="[&_tr]:border-b [&_tr]:border-border/50 [&_tr:last-child]:border-b-0">
            {pageItems.map((book) => (
              <BookTableRow
                key={book.id}
                book={book}
                showFinishedOn={showFinishedOn}
                onOpenTags={onOpenTags}
              />
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <p className="text-sm tabular-nums text-muted-foreground">
            Showing {firstVisibleBook}–{lastVisibleBook} of {sortedBooks.length}{" "}
            {sortedBooks.length === 1 ? "book" : "books"}
          </p>
          <div className="flex items-center gap-2">
            <Label
              htmlFor="book-table-page-size"
              className="text-sm font-normal text-muted-foreground"
            >
              Per page
            </Label>
            <Select
              value={String(pageSize)}
              onValueChange={handlePageSizeChange}
            >
              <SelectTrigger
                id="book-table-page-size"
                size="sm"
                aria-label="Books per page"
                className="w-[4.5rem]"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BOOK_TABLE_PAGE_SIZE_OPTIONS.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={() => setPage(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
            aria-label="Go to previous page"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <p className="min-w-[6.5rem] text-center text-sm tabular-nums text-foreground">
            Page {currentPage} of {pageCount}
          </p>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={() => setPage(Math.min(pageCount, currentPage + 1))}
            disabled={currentPage >= pageCount}
            aria-label="Go to next page"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
