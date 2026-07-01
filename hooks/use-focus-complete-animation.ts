"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  setFocusListItemStatus,
  type FocusListItem,
} from "@/lib/focus-list";

const COMPLETE_ENTER_MS = 150;

export function useFocusCompleteAnimation(
  onPersistComplete: (itemId: string) => void,
  prefersReducedMotion: boolean
) {
  const [exitingTodoSnapshots, setExitingTodoSnapshots] = useState<
    Map<string, FocusListItem>
  >(new Map());
  const [enteringCompleteIds, setEnteringCompleteIds] = useState<Set<string>>(
    new Set()
  );
  const enterTimeoutsRef = useRef<Map<string, number>>(new Map());

  const clearEnterTimeout = useCallback((itemId: string) => {
    const timeout = enterTimeoutsRef.current.get(itemId);
    if (timeout) {
      clearTimeout(timeout);
      enterTimeoutsRef.current.delete(itemId);
    }
  }, []);

  const scheduleEnterAnimation = useCallback(
    (itemId: string) => {
      if (prefersReducedMotion) {
        return;
      }

      clearEnterTimeout(itemId);
      setEnteringCompleteIds((previous) => new Set(previous).add(itemId));

      const timeout = window.setTimeout(() => {
        setEnteringCompleteIds((previous) => {
          const next = new Set(previous);
          next.delete(itemId);
          return next;
        });
        enterTimeoutsRef.current.delete(itemId);
      }, COMPLETE_ENTER_MS);

      enterTimeoutsRef.current.set(itemId, timeout);
    },
    [clearEnterTimeout, prefersReducedMotion]
  );

  useEffect(() => {
    const timeouts = enterTimeoutsRef.current;
    return () => {
      for (const timeout of timeouts.values()) {
        clearTimeout(timeout);
      }
      timeouts.clear();
    };
  }, []);

  const handleStartComplete = useCallback(
    (itemId: string, items: FocusListItem[]) => {
      const item = items.find((entry) => entry.id === itemId);
      if (!item) {
        return;
      }

      onPersistComplete(itemId);

      if (prefersReducedMotion) {
        return;
      }

      setExitingTodoSnapshots((previous) => new Map(previous).set(itemId, item));
    },
    [onPersistComplete, prefersReducedMotion]
  );

  const handleExitAnimationEnd = useCallback(
    (itemId: string) => {
      setExitingTodoSnapshots((previous) => {
        const next = new Map(previous);
        next.delete(itemId);
        return next;
      });
      scheduleEnterAnimation(itemId);
    },
    [scheduleEnterAnimation]
  );

  const getTodoDisplayItems = useCallback(
    (items: FocusListItem[]) => {
      const todoItems = items.filter((item) => item.status === "todo");
      const todoIds = new Set(todoItems.map((item) => item.id));

      const exitingItems = [...exitingTodoSnapshots.values()].filter(
        (item) => !todoIds.has(item.id)
      );

      return [...todoItems, ...exitingItems];
    },
    [exitingTodoSnapshots]
  );

  const isExiting = useCallback(
    (itemId: string) => exitingTodoSnapshots.has(itemId),
    [exitingTodoSnapshots]
  );

  return {
    enteringCompleteIds,
    getTodoDisplayItems,
    handleStartComplete,
    handleExitAnimationEnd,
    isExiting,
  };
}

export function persistFocusItemComplete(
  items: FocusListItem[],
  itemId: string
): FocusListItem[] {
  return setFocusListItemStatus(items, itemId, "complete");
}
