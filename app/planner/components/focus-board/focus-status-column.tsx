"use client";

import { useMemo, type DragEvent, type ReactNode } from "react";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";

import { cn } from "@/lib/utils";
import type { FocusItemStatus, FocusListItem, FocusListSubitem } from "@/lib/focus-list";
import { CompleteSection } from "./focus-complete-section";
import { FocusBoardItemRow } from "./focus-board-item-row";
import { SortableFocusBoardItemRow } from "./sortable-focus-board-item-row";
import { STATUS_LABELS } from "./constants";

interface FocusStatusColumnProps {
  status: FocusItemStatus;
  items: FocusListItem[];
  todoDisplayItems?: FocusListItem[];
  getItemLabel: (item: FocusListItem) => string;
  getItemSubitems: (item: FocusListItem) => FocusListSubitem[];
  getItemDescription?: (item: FocusListItem) => string | undefined;
  isExiting: (itemId: string) => boolean;
  enteringCompleteIds: Set<string>;
  dropTargetIndex: number | null;
  prefersReducedMotion?: boolean;
  onDropAtIndex: (status: FocusItemStatus, index: number, event: DragEvent) => void;
  onDragEnterIndex: (index: number) => void;
  onReopen: (itemId: string) => void;
  onRemove: (itemId: string) => void;
  onStartComplete: (itemId: string) => void;
  onExitAnimationEnd: (itemId: string) => void;
  footer?: ReactNode;
}

export function FocusStatusColumn({
  status,
  items,
  todoDisplayItems,
  getItemLabel,
  getItemSubitems,
  getItemDescription,
  isExiting,
  enteringCompleteIds,
  dropTargetIndex,
  prefersReducedMotion = false,
  onDropAtIndex,
  onDragEnterIndex,
  onReopen,
  onRemove,
  onStartComplete,
  onExitAnimationEnd,
  footer,
}: FocusStatusColumnProps) {
  if (status === "complete") {
    return (
      <CompleteSection
        items={items}
        getItemLabel={getItemLabel}
        getItemSubitems={getItemSubitems}
        getItemDescription={getItemDescription}
        enteringCompleteIds={enteringCompleteIds}
        dropTargetIndex={dropTargetIndex}
        onDropAtIndex={onDropAtIndex}
        onDragEnterIndex={onDragEnterIndex}
        onReopen={onReopen}
        onRemove={onRemove}
      />
    );
  }

  const exitingItems = useMemo(() => {
    if (!todoDisplayItems) {
      return [];
    }

    const itemIds = new Set(items.map((item) => item.id));
    return todoDisplayItems.filter((item) => !itemIds.has(item.id));
  }, [items, todoDisplayItems]);

  const sortableIds = useMemo(() => items.map((item) => item.id), [items]);

  return (
    <section
      aria-label={`${STATUS_LABELS.todo} column`}
      className="flex flex-col gap-2.5"
    >
      <div className="flex items-center gap-2 border-b border-border/60 pb-2.5">
        <h3 className="text-sm font-semibold text-foreground">
          {STATUS_LABELS.todo}
        </h3>
        <span className="rounded-full bg-muted/80 px-2 py-0.5 text-[11px] font-medium tabular-nums text-muted-foreground">
          {items.length}
        </span>
      </div>

      <div className="space-y-2">
        {items.length === 0 && exitingItems.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/40 px-4 py-6 text-center text-sm text-muted-foreground">
            Nothing queued yet.
          </div>
        ) : (
          <SortableContext
            items={sortableIds}
            strategy={verticalListSortingStrategy}
          >
            {items.map((item) => (
              <SortableFocusBoardItemRow
                key={item.id}
                item={item}
                label={getItemLabel(item)}
                subitems={getItemSubitems(item)}
                description={getItemDescription?.(item)}
                isExiting={isExiting(item.id)}
                prefersReducedMotion={prefersReducedMotion}
                onStartComplete={onStartComplete}
                onExitAnimationEnd={onExitAnimationEnd}
                onReopen={onReopen}
                onRemove={onRemove}
              />
            ))}
          </SortableContext>
        )}
        {exitingItems.map((item) => (
          <FocusBoardItemRow
            key={item.id}
            item={item}
            label={getItemLabel(item)}
            subitems={getItemSubitems(item)}
            description={getItemDescription?.(item)}
            isExiting
            prefersReducedMotion={prefersReducedMotion}
            onStartComplete={onStartComplete}
            onExitAnimationEnd={onExitAnimationEnd}
            onReopen={onReopen}
            onRemove={onRemove}
          />
        ))}
        {footer}
      </div>
    </section>
  );
}
