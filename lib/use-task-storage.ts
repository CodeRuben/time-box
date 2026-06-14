"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import type { Task, NewTask, ChecklistItem } from "@/lib/task-types";

const STORAGE_KEY = "tasks";
const TASKS_API = "/api/tasks";

type StorageMode = "local" | "account";

// Updates may be a plain patch or a function resolved against the current task,
// letting callers compute fields (e.g. a toggled checklist) from the freshest
// state rather than a stale render closure.
type TaskUpdate =
  | Partial<NewTask>
  | ((current: Task) => Partial<NewTask>);

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
  // Mirror the latest tasks into a ref so async callbacks can read the
  // current snapshot without relying on stale closures.
  const tasksRef = useRef<Task[]>(tasks);
  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  // Monotonic per-task request counter. Lets us ignore a server response (or
  // rollback) once a newer update for the same task has been issued, so an
  // out-of-order or slow response can't revert a more recent edit.
  const updateSeqRef = useRef<Map<string, number>>(new Map());

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
    async (id: string, updates: TaskUpdate): Promise<void> => {
      // Read the previous snapshot before mutating so we can roll back if the
      // server rejects the update. Reading from `tasksRef` avoids relying on
      // setState updater side-effects, which can be unreliable under React
      // concurrent rendering / StrictMode double-invocation.
      const previous = tasksRef.current.find((t) => t.id === id);
      if (!previous) return;

      // Resolve functional updates against the freshest snapshot so two rapid
      // edits (e.g. toggling two checklist items) each build their payload from
      // the prior edit's result instead of the same stale render closure, which
      // would otherwise drop one change at the DB level.
      const resolved =
        typeof updates === "function" ? updates(previous) : updates;
      const optimistic: Task = {
        ...previous,
        ...resolved,
        updatedAt: new Date().toISOString(),
      };
      const nextTasks = tasksRef.current.map((t) =>
        t.id === id ? optimistic : t
      );
      // Keep the ref current synchronously so a follow-up call in the same tick
      // sees this edit.
      tasksRef.current = nextTasks;

      if (modeRef.current === "account") {
        const seq = (updateSeqRef.current.get(id) ?? 0) + 1;
        updateSeqRef.current.set(id, seq);
        const isLatest = () => updateSeqRef.current.get(id) === seq;

        setTasks(nextTasks);

        try {
          const updated = await updateAccountTask(id, resolved);
          // A newer update for this task superseded us mid-flight; its
          // optimistic state is the source of truth, so don't overwrite it
          // with our (now stale) server response.
          if (isLatest()) {
            tasksRef.current = tasksRef.current.map((t) =>
              t.id === id ? updated : t
            );
            setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
          }
        } catch (error) {
          console.error("Failed to update task:", error);
          // Only roll back if we're still the latest update; otherwise a newer
          // edit owns the current state and must not be clobbered.
          if (isLatest()) {
            tasksRef.current = tasksRef.current.map((t) =>
              t.id === id ? previous : t
            );
            setTasks((prev) => prev.map((t) => (t.id === id ? previous : t)));
          }
          throw error;
        }
        return;
      }

      setTasks(nextTasks);
      saveLocalTasks(nextTasks);
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
