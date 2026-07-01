"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import {
  FocusBoardItemRow,
  type FocusBoardItemRowProps,
} from "./focus-board-item-row";

type SortableFocusBoardItemRowProps = Omit<
  FocusBoardItemRowProps,
  "rowRef" | "rowStyle" | "dragHandleProps" | "isDragging"
>;

export function SortableFocusBoardItemRow({
  item,
  prefersReducedMotion = false,
  isExiting = false,
  ...props
}: SortableFocusBoardItemRowProps) {
  const canDrag = !isExiting && item.status !== "complete";

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.id,
    disabled: !canDrag,
  });

  return (
    <FocusBoardItemRow
      item={item}
      isExiting={isExiting}
      isDragging={isDragging}
      prefersReducedMotion={prefersReducedMotion}
      rowRef={setNodeRef}
      rowStyle={
        canDrag
          ? {
              transform: CSS.Transform.toString(transform),
              transition: prefersReducedMotion ? undefined : transition,
            }
          : undefined
      }
      dragHandleProps={
        canDrag ? { ...attributes, ...listeners } : undefined
      }
      {...props}
    />
  );
}
