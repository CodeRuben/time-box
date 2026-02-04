"use client";

import { useState, useRef } from "react";
import type { HourlyItem } from "@/lib/use-planner-storage";

/**
 * Hook to manage new item input state and handlers.
 * Handles adding new items to a list with keyboard support.
 */
export function useNewItem(
  items: HourlyItem[],
  onUpdateItems: (items: HourlyItem[]) => void
) {
  const [newItemText, setNewItemText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleAdd = () => {
    const trimmedText = newItemText.trim();
    if (trimmedText) {
      const newItem: HourlyItem = {
        id: crypto.randomUUID(),
        text: trimmedText,
        status: "pending",
      };
      onUpdateItems([...items, newItem]);
      setNewItemText("");
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  };

  return {
    newItemText,
    setNewItemText,
    inputRef,
    handleAdd,
    handleKeyDown,
  };
}
