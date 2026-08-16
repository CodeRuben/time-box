"use client";

import { useCallback, useMemo, type Dispatch, type DragEvent, type SetStateAction } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";

import {
  addFocusListItem,
  FOCUS_STATUS_ORDER,
  getFocusListDragItemId,
  getFocusListItemLabel,
  getFocusListItemSubitems,
  getItemsByStatus,
  moveFocusListItem,
  removeFocusListItem,
  reorderFocusListItems,
  setFocusListItemStatus,
  type FocusItemStatus,
  type FocusListItem,
} from "@/lib/focus-list";
import { getFocusItemSourceKey, type FocusItemSource } from "@/lib/focus-item-source";
import type { BrainDumpPriorityCandidate } from "@/lib/parse-brain-dump-priorities";
import type { TopPriority } from "@/lib/use-planner-storage";
import { getFocusAddOptions } from "../add-to-focus-menu";
import {
  persistFocusItemComplete,
  useFocusCompleteAnimation,
} from "@/hooks/use-focus-complete-animation";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { FocusStatusColumn } from "./focus-status-column";
import { FocusBoardEmptyState } from "./focus-board-empty-state";
import { FocusBoardAddField } from "./focus-board-add-field";

interface FocusBoardProps {
  items: FocusListItem[];
  onItemsChange: Dispatch<SetStateAction<FocusListItem[]>>;
  priorities: TopPriority[];
  brainDumpCandidates: BrainDumpPriorityCandidate[];
}

export function FocusBoard({
  items,
  onItemsChange,
  priorities,
  brainDumpCandidates,
}: FocusBoardProps) {
  const prefersReducedMotion = usePrefersReducedMotion();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handlePersistComplete = useCallback(
    (itemId: string) => {
      onItemsChange((current) => persistFocusItemComplete(current, itemId));
    },
    [onItemsChange]
  );

  const {
    enteringCompleteIds,
    getTodoDisplayItems,
    handleStartComplete,
    handleExitAnimationEnd,
    isExiting,
  } = useFocusCompleteAnimation(handlePersistComplete, prefersReducedMotion);

  const itemsByStatus = useMemo(
    () =>
      Object.fromEntries(
        FOCUS_STATUS_ORDER.map((status) => [
          status,
          getItemsByStatus(items, status),
        ])
      ) as Record<FocusItemStatus, FocusListItem[]>,
    [items]
  );

  const todoDisplayItems = useMemo(
    () => getTodoDisplayItems(items),
    [getTodoDisplayItems, items]
  );

  const existingSourceKeys = useMemo(
    () => new Set(items.map((item) => getFocusItemSourceKey(item.source))),
    [items]
  );

  const getItemLabel = useCallback(
    (item: FocusListItem) => getFocusListItemLabel(item, priorities),
    [priorities]
  );

  const getItemSubitems = useCallback(
    (item: FocusListItem) =>
      getFocusListItemSubitems(item, {
        priorities,
        brainDumpCandidates,
      }),
    [priorities, brainDumpCandidates]
  );

  const { hasOptions: hasAddOptions } = useMemo(
    () =>
      getFocusAddOptions({
        priorities,
        brainDumpCandidates,
        existingSourceKeys,
      }),
    [priorities, brainDumpCandidates, existingSourceKeys]
  );

  const handleAddSource = useCallback(
    (source: FocusItemSource) => {
      onItemsChange((current) => addFocusListItem(current, source));
    },
    [onItemsChange]
  );

  const handleRemove = useCallback(
    (itemId: string) => {
      onItemsChange((current) => removeFocusListItem(current, itemId));
    },
    [onItemsChange]
  );

  const handleStartCompleteItem = useCallback(
    (itemId: string) => {
      handleStartComplete(itemId, items);
    },
    [handleStartComplete, items]
  );

  const handleReopen = useCallback(
    (itemId: string) => {
      onItemsChange((current) =>
        setFocusListItemStatus(current, itemId, "todo")
      );
    },
    [onItemsChange]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) {
        return;
      }

      onItemsChange((current) =>
        reorderFocusListItems(
          current,
          "todo",
          String(active.id),
          String(over.id)
        )
      );
    },
    [onItemsChange]
  );

  const handleDropAtIndex = useCallback(
    (status: FocusItemStatus, targetIndex: number, event: DragEvent) => {
      event.preventDefault();

      const itemId = getFocusListDragItemId(event);
      if (!itemId) return;

      onItemsChange((current) =>
        moveFocusListItem(current, itemId, status, targetIndex)
      );
    },
    [onItemsChange]
  );

  const addField = (
    <FocusBoardAddField
      onAdd={handleAddSource}
      priorities={priorities}
      brainDumpCandidates={brainDumpCandidates}
      existingSourceKeys={existingSourceKeys}
      hasAddOptions={hasAddOptions}
    />
  );

  const isEmpty = items.length === 0;

  return (
    <div className="flex h-full min-h-0 flex-col rounded-md border border-input bg-card p-4 shadow-xs dark:bg-card/95 sm:p-5">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto scrollbar-themed pr-1 lg:min-h-full">
          {isEmpty ? (
            <FocusBoardEmptyState>{addField}</FocusBoardEmptyState>
          ) : (
            FOCUS_STATUS_ORDER.map((status) => (
              <FocusStatusColumn
                key={status}
                status={status}
                items={itemsByStatus[status]}
                todoDisplayItems={
                  status === "todo" ? todoDisplayItems : undefined
                }
                getItemLabel={getItemLabel}
                getItemSubitems={getItemSubitems}
                getItemDescription={() => undefined}
                isExiting={isExiting}
                enteringCompleteIds={enteringCompleteIds}
                dropTargetIndex={null}
                prefersReducedMotion={prefersReducedMotion}
                onDropAtIndex={handleDropAtIndex}
                onDragEnterIndex={() => {}}
                onStartComplete={handleStartCompleteItem}
                onExitAnimationEnd={handleExitAnimationEnd}
                onReopen={handleReopen}
                onRemove={handleRemove}
                footer={status === "todo" ? addField : undefined}
              />
            ))
          )}
        </div>
      </DndContext>
    </div>
  );
}
