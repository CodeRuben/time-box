import type { DragEvent } from "react";
import type { FocusItemSource } from "@/lib/focus-item-source";
import { getFocusItemSourceKey } from "@/lib/focus-item-source";
import { toTitleCase } from "@/lib/title-case";

export type FocusItemStatus = "todo" | "complete";

export type FocusListItem = {
  id: string;
  source: FocusItemSource;
  status: FocusItemStatus;
  order: number;
};

export const FOCUS_LIST_DRAG_MIME = "application/x-focus-list-item";

export const FOCUS_STATUS_ORDER: FocusItemStatus[] = ["todo", "complete"];

export function getItemsByStatus(
  items: FocusListItem[],
  status: FocusItemStatus
): FocusListItem[] {
  return items
    .filter((item) => item.status === status)
    .sort((a, b) => a.order - b.order);
}

export function addFocusListItem(
  items: FocusListItem[],
  source: FocusItemSource
): FocusListItem[] {
  const maxOrder = getItemsByStatus(items, "todo").reduce(
    (max, item) => Math.max(max, item.order),
    -1
  );

  const nextItem: FocusListItem = {
    id: crypto.randomUUID(),
    source,
    status: "todo",
    order: maxOrder + 1,
  };

  return [...items, nextItem];
}

export function removeFocusListItem(
  items: FocusListItem[],
  itemId: string
): FocusListItem[] {
  return items.filter((item) => item.id !== itemId);
}

export function setFocusListItemStatus(
  items: FocusListItem[],
  itemId: string,
  status: FocusItemStatus
): FocusListItem[] {
  const maxOrder = getItemsByStatus(items, status).reduce(
    (max, item) => Math.max(max, item.order),
    -1
  );

  return items.map((item) =>
    item.id === itemId ? { ...item, status, order: maxOrder + 1 } : item
  );
}

export function moveFocusListItem(
  items: FocusListItem[],
  itemId: string,
  status: FocusItemStatus,
  targetIndex: number
): FocusListItem[] {
  const moved = items.find((item) => item.id === itemId);
  if (!moved) {
    return items;
  }

  const sourceColumnItems = getItemsByStatus(items, moved.status);
  const sourceIndex = sourceColumnItems.findIndex((item) => item.id === itemId);

  const columnItems = getItemsByStatus(
    items.filter((item) => item.id !== itemId),
    status
  );

  let adjustedIndex = targetIndex;
  if (moved.status === status && sourceIndex !== -1 && sourceIndex < targetIndex) {
    adjustedIndex = targetIndex - 1;
  }

  const clampedIndex = Math.max(0, Math.min(adjustedIndex, columnItems.length));
  columnItems.splice(clampedIndex, 0, { ...moved, status });

  const orderById = new Map(
    columnItems.map((item, index) => [item.id, index])
  );

  return items.map((item) => {
    if (item.id === itemId) {
      return { ...item, status, order: orderById.get(item.id)! };
    }
    if (item.status === status && orderById.has(item.id)) {
      return { ...item, order: orderById.get(item.id)! };
    }
    return item;
  });
}

export function reorderFocusListItems(
  items: FocusListItem[],
  status: FocusItemStatus,
  activeId: string,
  overId: string
): FocusListItem[] {
  const columnItems = getItemsByStatus(items, status);
  const oldIndex = columnItems.findIndex((item) => item.id === activeId);
  const newIndex = columnItems.findIndex((item) => item.id === overId);

  if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) {
    return items;
  }

  const reordered = [...columnItems];
  const [removed] = reordered.splice(oldIndex, 1);
  reordered.splice(newIndex, 0, removed);

  const orderById = new Map(
    reordered.map((item, index) => [item.id, index])
  );

  return items.map((item) => {
    if (item.status === status && orderById.has(item.id)) {
      return { ...item, order: orderById.get(item.id)! };
    }
    return item;
  });
}

export function setFocusListDragData(event: DragEvent, itemId: string) {
  event.dataTransfer.setData(FOCUS_LIST_DRAG_MIME, itemId);
  event.dataTransfer.setData("text/plain", itemId);
  event.dataTransfer.effectAllowed = "move";
}

export function getFocusListDragItemId(event: DragEvent): string | null {
  const id =
    event.dataTransfer.getData(FOCUS_LIST_DRAG_MIME) ||
    event.dataTransfer.getData("text/plain");
  return id || null;
}

export type FocusListSubitem = {
  name: string;
  completed?: boolean;
};

export function getFocusListItemSubitems(
  item: FocusListItem,
  context: {
    priorities: ReadonlyArray<{
      id: string;
      subtasks: ReadonlyArray<{ name: string; completed: boolean }>;
    }>;
    brainDumpCandidates: ReadonlyArray<{ name: string; subtasks: string[] }>;
  }
): FocusListSubitem[] {
  const { source } = item;

  switch (source.type) {
    case "priority": {
      const priority = context.priorities.find(
        (entry) => entry.id === source.priorityId
      );
      return (priority?.subtasks ?? []).map((subtask) => ({
        name: subtask.name,
        completed: subtask.completed,
      }));
    }
    case "brain_dump": {
      const key = source.text.trim().toLowerCase();
      const candidate = context.brainDumpCandidates.find(
        (entry) => entry.name.trim().toLowerCase() === key
      );
      return (candidate?.subtasks ?? []).map((name) => ({ name }));
    }
    case "recurring_task":
      return [];
  }
}

export function getFocusListItemLabel(
  item: FocusListItem,
  priorities: ReadonlyArray<{ id: string; name: string }>
): string {
  const { source } = item;

  let label: string;
  switch (source.type) {
    case "priority": {
      const priority = priorities.find((entry) => entry.id === source.priorityId);
      label = priority?.name.trim() || source.label;
      break;
    }
    case "brain_dump":
      label = source.text;
      break;
    case "recurring_task":
      label = source.label;
      break;
  }

  return toTitleCase(label);
}

export function isValidFocusListItem(value: unknown): value is FocusListItem {
  if (!value || typeof value !== "object") {
    return false;
  }

  const item = value as FocusListItem;

  if (typeof item.id !== "string") {
    return false;
  }

  if (typeof item.order !== "number") {
    return false;
  }

  if (item.status !== "todo" && item.status !== "complete") {
    return false;
  }

  if (!item.source || typeof item.source !== "object") {
    return false;
  }

  switch (item.source.type) {
    case "priority":
      return (
        typeof item.source.priorityId === "string" &&
        typeof item.source.label === "string"
      );
    case "brain_dump":
      return typeof item.source.text === "string";
    case "recurring_task":
      return (
        typeof item.source.recurringTaskId === "string" &&
        typeof item.source.occurrenceId === "string" &&
        typeof item.source.label === "string"
      );
    default:
      return false;
  }
}

export function parseFocusListItems(raw: unknown): FocusListItem[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.filter(isValidFocusListItem);
}

export function appendCopiedFocusListItems(
  current: FocusListItem[],
  copied: FocusListItem[]
): FocusListItem[] {
  const existingKeys = new Set(
    current.map((item) => getFocusItemSourceKey(item.source))
  );
  const itemsToAdd = copied.filter(
    (item) => !existingKeys.has(getFocusItemSourceKey(item.source))
  );

  if (itemsToAdd.length === 0) {
    return current;
  }

  let nextTodoOrder =
    getItemsByStatus(current, "todo").reduce(
      (max, item) => Math.max(max, item.order),
      -1
    ) + 1;
  let nextCompleteOrder =
    getItemsByStatus(current, "complete").reduce(
      (max, item) => Math.max(max, item.order),
      -1
    ) + 1;

  const merged = [...current];

  for (const item of itemsToAdd) {
    if (item.status === "todo") {
      merged.push({ ...item, order: nextTodoOrder });
      nextTodoOrder += 1;
    } else {
      merged.push({ ...item, order: nextCompleteOrder });
      nextCompleteOrder += 1;
    }
  }

  return merged;
}

export function renormalizeFocusListOrders(items: FocusListItem[]): FocusListItem[] {
  const orderById = new Map<string, number>();

  getItemsByStatus(items, "todo").forEach((item, index) => {
    orderById.set(item.id, index);
  });
  getItemsByStatus(items, "complete").forEach((item, index) => {
    orderById.set(item.id, index);
  });

  return items.map((item) => ({
    ...item,
    order: orderById.get(item.id) ?? item.order,
  }));
}

export function copyFocusListItems(
  items: FocusListItem[],
  onlyUnfinished: boolean
): FocusListItem[] {
  return items
    .filter((item) => !onlyUnfinished || item.status === "todo")
    .map((item) => ({
      ...item,
      id: crypto.randomUUID(),
      source: { ...item.source },
    }));
}
