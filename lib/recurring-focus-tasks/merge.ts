import { getItemsByStatus, type FocusListItem } from "@/lib/focus-list";

function nextTodoOrder(focusList: FocusListItem[]): number {
  return (
    getItemsByStatus(focusList, "todo").reduce(
      (max, item) => Math.max(max, item.order),
      -1
    ) + 1
  );
}

export function mergeRecurringFocusListItems(
  current: FocusListItem[],
  added: FocusListItem[]
): FocusListItem[] {
  if (added.length === 0) {
    return current;
  }

  let order = nextTodoOrder(current);
  const merged = [...current];

  for (const item of added) {
    merged.push({ ...item, order });
    order += 1;
  }

  return merged;
}
