"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  ProductNoteCreateInput,
  ProductNoteDto,
  ProductNotePatchInput,
} from "@/lib/product-notes/types";

const API_PREFIX = "/api/product-notes";

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as { error?: string };
    return payload.error || "Request failed";
  } catch {
    return "Request failed";
  }
}

export function useProductNotes(enabled: boolean) {
  const [notes, setNotes] = useState<ProductNoteDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!enabled) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(API_PREFIX, {
        cache: "no-store",
        credentials: "same-origin",
      });

      if (!response.ok) {
        throw new Error(await readErrorMessage(response));
      }

      const payload = (await response.json()) as {
        data?: ProductNoteDto[];
      };
      setNotes(Array.isArray(payload.data) ? payload.data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load notes");
      setNotes([]);
    } finally {
      setIsLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setNotes([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    void reload();
  }, [enabled, reload]);

  const createNote = useCallback(
    async (input: ProductNoteCreateInput) => {
      const response = await fetch(API_PREFIX, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        throw new Error(await readErrorMessage(response));
      }

      await reload();
    },
    [reload]
  );

  const updateNote = useCallback(
    async (id: string, patch: ProductNotePatchInput) => {
      const response = await fetch(`${API_PREFIX}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(patch),
      });

      if (!response.ok) {
        throw new Error(await readErrorMessage(response));
      }

      await reload();
    },
    [reload]
  );

  const deleteNote = useCallback(
    async (id: string) => {
      const response = await fetch(`${API_PREFIX}/${id}`, {
        method: "DELETE",
        credentials: "same-origin",
      });

      if (!response.ok) {
        throw new Error(await readErrorMessage(response));
      }

      await reload();
    },
    [reload]
  );

  return {
    notes,
    isLoading,
    error,
    createNote,
    updateNote,
    deleteNote,
    reload,
  };
}
