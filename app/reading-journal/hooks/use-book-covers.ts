"use client";

import { useEffect, useState } from "react";
import type { CoverOption } from "@/lib/book-search";

/**
 * Fetches alternate cover options for a work, but only while `enabled` — the
 * gallery is opened on demand rather than prefetched for every search result.
 */
export function useBookCovers(openLibraryKey: string, enabled: boolean) {
  const [options, setOptions] = useState<CoverOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!enabled || !openLibraryKey) {
      setOptions([]);
      setFailed(false);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setFailed(false);

    void (async () => {
      try {
        const response = await fetch(
          `/api/book-search/covers?key=${encodeURIComponent(openLibraryKey)}`,
          { credentials: "same-origin" }
        );
        if (!response.ok) throw new Error("Cover lookup failed");
        const payload = (await response.json()) as { data: CoverOption[] };
        if (!cancelled) setOptions(payload.data);
      } catch (error) {
        console.error("Cover lookup failed:", error);
        if (!cancelled) {
          setOptions([]);
          setFailed(true);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [openLibraryKey, enabled]);

  return { options, isLoading, failed };
}
