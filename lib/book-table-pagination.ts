export const BOOK_TABLE_PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

export type BookTablePageSize = (typeof BOOK_TABLE_PAGE_SIZE_OPTIONS)[number];

export const BOOK_TABLE_PAGE_SIZE: BookTablePageSize = 25;

export function parseBookTablePageSize(value: string): BookTablePageSize | null {
  for (const size of BOOK_TABLE_PAGE_SIZE_OPTIONS) {
    if (String(size) === value) return size;
  }
  return null;
}

export function getPageCount(totalItems: number, pageSize: number): number {
  if (totalItems <= 0 || pageSize <= 0) return 1;
  return Math.max(1, Math.ceil(totalItems / pageSize));
}

export function paginateItems<T>(
  items: T[],
  page: number,
  pageSize: number = BOOK_TABLE_PAGE_SIZE
): T[] {
  const pageCount = getPageCount(items.length, pageSize);
  const safePage = Math.min(Math.max(page, 1), pageCount);
  const start = (safePage - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

export function getVisibleBookRange(
  totalItems: number,
  page: number,
  pageSize: number
): { first: number; last: number } {
  if (totalItems <= 0) return { first: 0, last: 0 };
  const pageCount = getPageCount(totalItems, pageSize);
  const currentPage = Math.min(Math.max(page, 1), pageCount);
  const first = (currentPage - 1) * pageSize + 1;
  const last = Math.min(currentPage * pageSize, totalItems);
  return { first, last };
}
