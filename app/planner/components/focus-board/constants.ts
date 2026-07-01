import type { FocusItemStatus } from "@/lib/focus-list";
import type { FocusItemSource } from "@/lib/focus-item-source";

export const COMPLETE_EXIT_MS = 180;

export const STATUS_LABELS: Record<FocusItemStatus, string> = {
  todo: "To do",
  complete: "Done",
};

export const completeSectionCollapsibleAnimation =
  "overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up motion-reduce:animate-none";

export const completeRowEnterAnimation =
  "animate-in fade-in-0 zoom-in-95 slide-in-from-top-1 duration-150 ease-out-cubic motion-reduce:animate-none";

export function getFocusSourceTypeLabel(type: FocusItemSource["type"]): string {
  switch (type) {
    case "priority":
      return "Priority";
    case "task":
      return "Task";
    case "brain_dump":
      return "Brain dump";
  }
}
