export type BookStatus = "reading" | "finished" | "abandoned";

export interface BookEntry {
  id: string;
  date: string; // YYYY-MM-DD
  currentPage: number | null;
  summary: string;
  analysis: string;
  thoughts: string;
  createdAt: string;
  updatedAt: string;
}

export interface BookSummaryView {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
  totalPages: number | null;
  status: BookStatus;
  rating: number | null; // 1-10 half-star scale, null = unrated
  currentPage: number | null; // derived from latest entry
  startedOn: string | null;
  finishedOn: string | null;
}

export interface BookDetailView extends BookSummaryView {
  publishedYear: number | null;
  openLibraryKey: string;
  notes: string;
  entries: BookEntry[]; // sorted by date descending
  readingDays: string[]; // YYYY-MM-DD strings, the ticked days
  createdAt: string;
  updatedAt: string;
}

export const BOOK_STATUS_OPTIONS: { value: BookStatus; label: string }[] = [
  { value: "reading", label: "Reading" },
  { value: "finished", label: "Finished" },
  { value: "abandoned", label: "Abandoned" },
];
