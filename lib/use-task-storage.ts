"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import type { Task, NewTask, ChecklistItem } from "@/lib/task-types";

const STORAGE_KEY = "tasks";
const TASKS_API = "/api/tasks";

type StorageMode = "local" | "account";

function getStorageMode(
  status: "authenticated" | "loading" | "unauthenticated"
): StorageMode | null {
  if (status === "loading") return null;
  return status === "authenticated" ? "account" : "local";
}

function loadLocalTasks(): Task[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? (JSON.parse(stored) as Task[]) : [];
  } catch {
    return [];
  }
}

function saveLocalTasks(tasks: Task[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (error) {
    console.error("Failed to save tasks to localStorage:", error);
  }
}

async function fetchAccountTasks(): Promise<Task[]> {
  const response = await fetch(TASKS_API, {
    cache: "no-store",
    credentials: "same-origin",
  });

  if (!response.ok) throw new Error("Failed to fetch tasks");
  const payload = (await response.json()) as { data: Task[] };
  return payload.data;
}

async function createAccountTask(task: NewTask): Promise<Task> {
  const response = await fetch(TASKS_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify(task),
  });

  if (!response.ok) throw new Error("Failed to create task");
  const payload = (await response.json()) as { data: Task };
  return payload.data;
}

async function updateAccountTask(
  id: string,
  updates: Partial<NewTask>
): Promise<Task> {
  const response = await fetch(`${TASKS_API}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify(updates),
  });

  if (!response.ok) throw new Error("Failed to update task");
  const payload = (await response.json()) as { data: Task };
  return payload.data;
}

async function deleteAccountTask(id: string): Promise<void> {
  const response = await fetch(`${TASKS_API}/${id}`, {
    method: "DELETE",
    credentials: "same-origin",
  });

  if (!response.ok) throw new Error("Failed to delete task");
}

function createLocalTask(newTask: NewTask): Task {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    ...newTask,
    createdAt: now,
    updatedAt: now,
  };
}

export function useTaskStorage() {
  const { status } = useSession();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const storageMode = getStorageMode(status);
  const modeRef = useRef<StorageMode | null>(null);

  useEffect(() => {
    if (!storageMode) {
      setIsLoading(true);
      return;
    }

    modeRef.current = storageMode;
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      try {
        const loaded =
          storageMode === "account" ? await fetchAccountTasks() : loadLocalTasks();
        if (!cancelled) setTasks(loaded);
      } catch (error) {
        console.error("Failed to load tasks:", error);
        if (!cancelled) setTasks([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [storageMode]);

  const addTask = useCallback(
    async (newTask: NewTask): Promise<Task> => {
      if (modeRef.current === "account") {
        // Optimistic insert with a temporary row so the UI updates immediately.
        const optimistic = createLocalTask(newTask);
        setTasks((prev) => [optimistic, ...prev]);

        try {
          const created = await createAccountTask(newTask);
          setTasks((prev) =>
            prev.map((t) => (t.id === optimistic.id ? created : t))
          );
          return created;
        } catch (error) {
          console.error("Failed to create task:", error);
          setTasks((prev) => prev.filter((t) => t.id !== optimistic.id));
          throw error;
        }
      }

      const task = createLocalTask(newTask);
      setTasks((prev) => {
        const next = [task, ...prev];
        saveLocalTasks(next);
        return next;
      });
      return task;
    },
    []
  );

  const updateTask = useCallback(
    async (id: string, updates: Partial<NewTask>): Promise<void> => {
      if (modeRef.current === "account") {
        let previous: Task | undefined;
        setTasks((prev) => {
          previous = prev.find((t) => t.id === id);
          if (!previous) return prev;
          return prev.map((t) =>
            t.id === id
              ? { ...t, ...updates, updatedAt: new Date().toISOString() }
              : t
          );
        });

        if (!previous) return;

        try {
          const updated = await updateAccountTask(id, updates);
          setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
        } catch (error) {
          console.error("Failed to update task:", error);
          const snapshot = previous;
          setTasks((prev) => prev.map((t) => (t.id === id ? snapshot : t)));
          throw error;
        }
        return;
      }

      setTasks((prev) => {
        const next = prev.map((t) =>
          t.id === id
            ? { ...t, ...updates, updatedAt: new Date().toISOString() }
            : t
        );
        saveLocalTasks(next);
        return next;
      });
    },
    []
  );

  const deleteTask = useCallback(async (id: string): Promise<void> => {
    if (modeRef.current === "account") {
      let previous: Task[] = [];
      setTasks((prev) => {
        previous = prev;
        return prev.filter((t) => t.id !== id);
      });

      try {
        await deleteAccountTask(id);
      } catch (error) {
        console.error("Failed to delete task:", error);
        setTasks(previous);
        throw error;
      }
      return;
    }

    setTasks((prev) => {
      const next = prev.filter((t) => t.id !== id);
      saveLocalTasks(next);
      return next;
    });
  }, []);

  const cloneTask = useCallback(
    async (task: Task): Promise<Task> => {
      const newTask: NewTask = {
        name: `${task.name} (copy)`,
        description: task.description,
        checklist: task.checklist.map((item) => ({
          ...item,
          id: crypto.randomUUID(),
          completed: false,
        })) as ChecklistItem[],
        status: "todo",
        type: task.type,
      };
      return addTask(newTask);
    },
    [addTask]
  );

  return {
    tasks,
    isLoading,
    addTask,
    updateTask,
    deleteTask,
    cloneTask,
  };
}
