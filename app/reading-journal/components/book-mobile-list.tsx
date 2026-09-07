"use client";

import { ArrowDown, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type BookSortColumn,
  type BookSortDirection,
} from "@/lib/book-table-sort";
import type { BookSummaryView } from "@/lib/reading-journal-types";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BOOK_ROW_INTERACTION_CLASS,
  BookCoverThumb,
  BookRowTitleLink,
  RatingBadge,
  TagsButton,
  bookHref,
  getPageCountLabel,
  getStatusLabel,
  formatShortDate,
  isBookSortColumn,
  visibleSortColumns,
} from "./book-table-cells";

function MobileSortControls({
  column,
  direction,
  showFinishedOn,
  onSort,
}: {
  column: BookSortColumn;
  direction: BookSortDirection;
  showFinishedOn: boolean;
  onSort: (column: BookSortColumn) => void;
}) {
  const options = visibleSortColumns(showFinishedOn);

  return (
    <div className="flex items-center justify-end gap-2">
      <Select
        value={column}
        onValueChange={(value) => {
          if (isBookSortColumn(value)) onSort(value);
        }}
      >
        <SelectTrigger size="sm" aria-label="Sort books by">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        aria-label={direction === "asc" ? "Sort descending" : "Sort ascending"}
        onClick={() => onSort(column)}
      >
        {direction === "asc" ? (
          <ArrowUp className="size-3.5" />
        ) : (
          <ArrowDown className="size-3.5" />
        )}
      </Button>
    </div>
  );
}

function BookMobileRow({
  book,
  showFinishedOn,
  onOpenTags,
}: {
  book: BookSummaryView;
  showFinishedOn: boolean;
  onOpenTags: (book: BookSummaryView) => void;
}) {
  const href = bookHref(book.id);
  const pageCount = getPageCountLabel(book);

  return (
    <li>
      <div className={cn("relative flex gap-3 py-3", BOOK_ROW_INTERACTION_CLASS)}>
        <BookCoverThumb book={book} className="h-14 w-[2.35rem]" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <BookRowTitleLink href={href} className="flex-1 line-clamp-2">
              {book.title}
            </BookRowTitleLink>
            <span className="shrink-0 pt-0.5 text-xs font-medium text-foreground">
              {getStatusLabel(book.status)}
            </span>
          </div>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-xs text-muted-foreground">
                {book.author || "Author unknown"}
              </p>
              <TagsButton book={book} labeled onOpenTags={onOpenTags} />
            </div>
            <div className="flex shrink-0 flex-col items-end gap-0.5 pt-0.5">
              <div className="flex items-center gap-2">
                <RatingBadge rating={book.rating} variant="compact" />
                {pageCount ? (
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {pageCount}
                  </span>
                ) : null}
              </div>
              {showFinishedOn && book.finishedOn ? (
                <p className="text-xs tabular-nums text-muted-foreground">
                  Finished {formatShortDate(book.finishedOn)}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </li>
  );
}

export function BookMobileList({
  books,
  showFinishedOn,
  onOpenTags,
  column,
  direction,
  onSort,
}: {
  books: BookSummaryView[];
  showFinishedOn: boolean;
  onOpenTags: (book: BookSummaryView) => void;
  column: BookSortColumn;
  direction: BookSortDirection;
  onSort: (column: BookSortColumn) => void;
}) {
  return (
    <div className="space-y-4 md:hidden">
      <MobileSortControls
        column={column}
        direction={direction}
        showFinishedOn={showFinishedOn}
        onSort={onSort}
      />
      <ul className="divide-y divide-border/50">
        {books.map((book) => (
          <BookMobileRow
            key={book.id}
            book={book}
            showFinishedOn={showFinishedOn}
            onOpenTags={onOpenTags}
          />
        ))}
      </ul>
    </div>
  );
}
