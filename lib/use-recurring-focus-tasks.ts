"use client";

import { useCallback, useEffect, useState } from "react";
import type { RecurringFocusTaskDto } from "@/lib/recurring-focus-tasks/types";
import type { RecurringFocusTaskInput } from "@/lib/recurring-focus-tasks/types";

const API_PREFIX = "/api/recurring-focus-tasks";

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as { error?: string };
    return payload.error || "Request failed";
  } catch {
    return "Request failed";
  }
}

export function useRecurringFocusTasks(enabled: boolean) {
  const [tasks, setTasks] = useState<RecurringFocusTaskDto[]>([]);
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
        data?: RecurringFocusTaskDto[];
      };
      setTasks(Array.isArray(payload.data) ? payload.data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tasks");
      setTasks([]);
    } finally {
      setIsLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setTasks([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    void reload();
  }, [enabled, reload]);

  const createTask = useCallback(
    async (input: RecurringFocusTaskInput) => {
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

  const updateTask = useCallback(
    async (id: string, patch: Partial<RecurringFocusTaskInput>) => {
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

  const deleteTask = useCallback(
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
    tasks,
    isLoading,
    error,
    createTask,
    updateTask,
    deleteTask,
    reload,
  };
}
