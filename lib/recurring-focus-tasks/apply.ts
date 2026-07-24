import "server-only";

import type { FocusListItem } from "@/lib/focus-list";
import { prisma } from "@/lib/prisma";
import { toRecurringFocusTaskDto } from "@/lib/recurring-focus-tasks/dto";
import { isRecurringFocusTaskActiveOnDate } from "@/lib/recurring-focus-tasks/schedule";

function isUniqueConstraintError(error: unknown): boolean {
  return (
    !!error &&
    typeof error === "object" &&
    "code" in error &&
    (error as { code?: string }).code === "P2002"
  );
}

/**
 * Creates occurrence rows for active tasks on `date` and returns focus-list
 * items the client should merge. Does not write PlannerDay — the client owns
 * planner JSON persistence.
 */
export async function applyRecurringFocusTasksForDate(
  userId: string,
  date: string
): Promise<FocusListItem[]> {
  return prisma.$transaction(async (tx) => {
    const tasks = await tx.recurringFocusTask.findMany({
      where: {
        userId,
        enabled: true,
      },
    });

    const existingOccurrences = await tx.recurringFocusTaskOccurrence.findMany({
      where: {
        userId,
        date,
      },
      select: {
        recurringFocusTaskId: true,
      },
    });
    const existingTaskIds = new Set(
      existingOccurrences.map((row) => row.recurringFocusTaskId)
    );

    const addedItems: FocusListItem[] = [];
    let nextOrder = 0;

    for (const task of tasks) {
      if (existingTaskIds.has(task.id)) {
        continue;
      }

      const dto = toRecurringFocusTaskDto(task);
      if (
        !isRecurringFocusTaskActiveOnDate(
          {
            enabled: dto.enabled,
            startDate: dto.startDate,
            endDate: dto.endDate,
            schedule: dto.schedule,
          },
          date
        )
      ) {
        continue;
      }

      const focusListItemId = crypto.randomUUID();
      const occurrenceId = crypto.randomUUID();

      try {
        await tx.recurringFocusTaskOccurrence.create({
          data: {
            id: occurrenceId,
            recurringFocusTaskId: task.id,
            userId,
            date,
            focusListItemId,
          },
        });
      } catch (error) {
        if (isUniqueConstraintError(error)) {
          continue;
        }
        throw error;
      }

      addedItems.push({
        id: focusListItemId,
        status: "todo",
        order: nextOrder,
        source: {
          type: "recurring_task",
          recurringTaskId: task.id,
          occurrenceId,
          label: task.title,
        },
      });
      nextOrder += 1;
      existingTaskIds.add(task.id);
    }

    return addedItems;
  });
}
