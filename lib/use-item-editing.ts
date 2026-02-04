"use client";

import { useState, useRef, useEffect } from "react";
import type { HourlyItem } from "@/lib/use-planner-storage";
import { cycleStatus } from "@/lib/task-utils";

/**
 * Hook to manage item editing state and handlers.
 * Handles inline editing, status cycling, and deletion of items.
 */
export function useItemEditing(
  items: HourlyItem[],
  onUpdateItems: (items: HourlyItem[]) => void
) {
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editItemText, setEditItemText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingItemId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingItemId]);

  const handleStartEdit = (item: HourlyItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingItemId(item.id);
    setEditItemText(item.text);
  };

  const handleBlur = () => {
    if (editingItemId) {
      const trimmedText = editItemText.trim();
      if (trimmedText) {
        const updatedItems = items.map((item) =>
          item.id === editingItemId ? { ...item, text: trimmedText } : item
        );
        onUpdateItems(updatedItems);
      } else {
        const updatedItems = items.filter((item) => item.id !== editingItemId);
        onUpdateItems(updatedItems);
      }
    }
    setEditingItemId(null);
    setEditItemText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleBlur();
    } else if (e.key === "Escape") {
      setEditingItemId(null);
      setEditItemText("");
    }
  };

  const handleCycleStatus = (itemId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedItems = items.map((item) =>
      item.id === itemId ? { ...item, status: cycleStatus(item.status) } : item
    );
    onUpdateItems(updatedItems);
  };

  const handleDelete = (itemId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedItems = items.filter((item) => item.id !== itemId);
    onUpdateItems(updatedItems);
  };

  return {
    editingItemId,
    editItemText,
    setEditItemText,
    inputRef,
    handleStartEdit,
    handleBlur,
    handleKeyDown,
    handleCycleStatus,
    handleDelete,
  };
}
