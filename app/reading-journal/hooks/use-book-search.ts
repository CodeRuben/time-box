"use client";

import { useEffect, useState } from "react";
import type { BookSearchResult } from "@/lib/book-search";

const SEARCH_DEBOUNCE_MS = 400;

export function useBookSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<BookSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchFailed, setSearchFailed] = useState(false);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setSearchFailed(false);
      setIsSearching(false);
      return;
    }

    let cancelled = false;
    setIsSearching(true);
    setSearchFailed(false);

    const timeout = setTimeout(() => {
      void (async () => {
        try {
          const response = await fetch(
            `/api/book-search?q=${encodeURIComponent(trimmed)}`,
            { credentials: "same-origin" }
          );
          if (!response.ok) throw new Error("Search failed");
          const payload = (await response.json()) as { data: BookSearchResult[] };
          if (!cancelled) {
            setResults(payload.data);
          }
        } catch (error) {
          console.error("Book search failed:", error);
          if (!cancelled) {
            setResults([]);
            setSearchFailed(true);
          }
        } finally {
          if (!cancelled) setIsSearching(false);
        }
      })();
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [query]);

  return { query, setQuery, results, isSearching, searchFailed };
}
