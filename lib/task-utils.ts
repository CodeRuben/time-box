import type { TaskStatus } from "@/lib/use-planner-storage";

/**
 * Cycles through task statuses: pending -> completed -> error -> pending
 */
export const cycleStatus = (status: TaskStatus): TaskStatus => {
  const cycle: TaskStatus[] = ["pending", "completed", "error"];
  const currentIndex = cycle.indexOf(status);
  return cycle[(currentIndex + 1) % cycle.length];
};
