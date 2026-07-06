export const OPEN_LIBRARY_USER_AGENT = "time-box reading journal (personal project)";

export interface OpenLibraryDoc {
  key: string;
  title: string;
  author_name?: string[];
  first_publish_year?: number;
  number_of_pages_median?: number;
  cover_i?: number;
  // Best-matching edition for the query (language-biased via the `lang` search param).
  // Its cover is usually a better default than the work-level cover_i, which Open
  // Library picks without regard to language.
  editions?: { docs?: { cover_i?: number }[] };
}

export interface BookSearchResult {
  openLibraryKey: string;
  title: string;
  author: string;
  publishedYear: number | null;
  totalPages: number | null;
  coverUrl: string;
}

export function mapOpenLibraryDoc(doc: OpenLibraryDoc): BookSearchResult {
  const coverId = doc.editions?.docs?.[0]?.cover_i ?? doc.cover_i;
  return {
    openLibraryKey: doc.key,
    title: doc.title,
    author: doc.author_name?.join(", ") ?? "",
    publishedYear: doc.first_publish_year ?? null,
    totalPages: doc.number_of_pages_median ?? null,
    coverUrl: coverId ? coverUrlForId(coverId) : "",
  };
}

export interface OpenLibraryEdition {
  key: string;
  covers?: number[];
  languages?: { key: string }[];
}

export interface CoverOption {
  coverId: number;
  coverUrl: string;
  /** ISO 639-2 code (e.g. "eng"), or null when the edition has no language set. */
  language: string | null;
}

const WORK_KEY_PATTERN = /^\/works\/(OL\d+W)$/;

/** Extracts the bare work id (e.g. "OL27258W") from a work key, or null if malformed. */
export function extractWorkId(openLibraryKey: string): string | null {
  return WORK_KEY_PATTERN.exec(openLibraryKey.trim())?.[1] ?? null;
}

function coverUrlForId(coverId: number): string {
  return `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`;
}

export function isOpenLibraryCoverUrl(url: string): boolean {
  try {
    return new URL(url).hostname === "covers.openlibrary.org";
  } catch {
    return false;
  }
}

/**
 * Builds the list of selectable covers across a work's editions. Open Library uses
 * -1 as a "no cover" sentinel, and the same cover id is often reused across editions,
 * so both are filtered out here rather than left for callers to handle.
 */
export function mapEditionsToCoverOptions(
  editions: OpenLibraryEdition[]
): CoverOption[] {
  const seenCoverIds = new Set<number>();
  const options: CoverOption[] = [];

  for (const edition of editions) {
    const language =
      edition.languages?.[0]?.key.replace("/languages/", "") ?? null;

    for (const coverId of edition.covers ?? []) {
      if (coverId <= 0 || seenCoverIds.has(coverId)) continue;
      seenCoverIds.add(coverId);
      options.push({ coverId, coverUrl: coverUrlForId(coverId), language });
    }
  }

  // English editions are the most common desire; surface them first without
  // discarding the rest, since editions.json is already ordered by relevance.
  const english = options.filter((option) => option.language === "eng");
  const rest = options.filter((option) => option.language !== "eng");
  return [...english, ...rest];
}
