"use client";

import { useState, useCallback } from "react";

interface DraggableProps {
  draggable: boolean;
  onDragStart: (e: React.DragEvent) => void;
}

/**
 * Hook for making an element draggable
 * Returns props to spread on the draggable element
 */
export function useDraggable(text: string, enabled: boolean = true): DraggableProps {
  const handleDragStart = useCallback(
    (e: React.DragEvent) => {
      if (!enabled || !text) return;
      e.dataTransfer.setData("text/plain", text);
      e.dataTransfer.effectAllowed = "copy";
    },
    [text, enabled]
  );

  return {
    draggable: enabled && !!text,
    onDragStart: handleDragStart,
  };
}

/**
 * Creates draggable props for inline use (useful in loops where hooks can't be called)
 */
export function getDraggableProps(text: string, enabled: boolean = true): DraggableProps {
  return {
    draggable: enabled && !!text,
    onDragStart: (e: React.DragEvent) => {
      if (!enabled || !text) return;
      e.dataTransfer.setData("text/plain", text);
      e.dataTransfer.effectAllowed = "copy";
    },
  };
}

interface UseDropZoneOptions {
  onDrop: (text: string) => void;
}

interface UseDropZoneReturn {
  isDragOver: boolean;
  dropZoneProps: {
    onDragOver: (e: React.DragEvent) => void;
    onDragEnter: (e: React.DragEvent) => void;
    onDragLeave: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent) => void;
  };
}

/**
 * Hook for making an element a drop zone
 * Returns isDragOver state and props to spread on the drop zone element
 */
export function useDropZone({ onDrop }: UseDropZoneOptions): UseDropZoneReturn {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const text = e.dataTransfer.getData("text/plain");
      if (text) {
        onDrop(text);
      }
    },
    [onDrop]
  );

  return {
    isDragOver,
    dropZoneProps: {
      onDragOver: handleDragOver,
      onDragEnter: handleDragEnter,
      onDragLeave: handleDragLeave,
      onDrop: handleDrop,
    },
  };
}
