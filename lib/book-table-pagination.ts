export const BOOK_TABLE_PAGE_SIZE = 10;

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

/** Compact page list with ellipses, e.g. [1, "ellipsis", 4, 5, 6, "ellipsis", 12] */
export function getPaginationItems(
  currentPage: number,
  pageCount: number
): Array<number | "ellipsis"> {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }

  if (currentPage <= 3) {
    return [1, 2, 3, 4, "ellipsis", pageCount];
  }

  if (currentPage >= pageCount - 2) {
    return [
      1,
      "ellipsis",
      pageCount - 3,
      pageCount - 2,
      pageCount - 1,
      pageCount,
    ];
  }

  return [
    1,
    "ellipsis",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "ellipsis",
    pageCount,
  ];
}
