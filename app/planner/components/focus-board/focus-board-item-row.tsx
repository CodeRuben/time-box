"use client";

import { useEffect, useState, type CSSProperties, type HTMLAttributes, type PointerEvent, type TransitionEvent } from "react";
import { Check, Clock, GripVertical, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { FocusListItem, FocusListSubitem } from "@/lib/focus-list";
import { COMPLETE_EXIT_MS } from "./constants";
import { FocusItemSubitemTrigger } from "./focus-item-subitem-trigger";

export interface FocusBoardItemRowProps {
  item: FocusListItem;
  label: string;
  subitems: FocusListSubitem[];
  description?: string;
  isExiting?: boolean;
  isDragging?: boolean;
  prefersReducedMotion?: boolean;
  rowRef?: (element: HTMLDivElement | null) => void;
  rowStyle?: CSSProperties;
  rowDragProps?: HTMLAttributes<HTMLDivElement>;
  onStartComplete: (itemId: string) => void;
  onExitAnimationEnd: (itemId: string) => void;
  onReopen: (itemId: string) => void;
  onRemove: (itemId: string) => void;
}

export function FocusBoardItemRow({
  item,
  label,
  subitems,
  description,
  isExiting = false,
  isDragging = false,
  prefersReducedMotion = false,
  rowRef,
  rowStyle,
  rowDragProps,
  onStartComplete,
  onExitAnimationEnd,
  onReopen,
  onRemove,
}: FocusBoardItemRowProps) {
  const [exitActive, setExitActive] = useState(false);
  const isComplete = item.status === "complete";
  const showCompletedCheck = isComplete || isExiting;
  const canDrag = Boolean(rowDragProps) && !isComplete && !isExiting;

  const stopRowDrag = (event: PointerEvent<HTMLElement>) => {
    event.stopPropagation();
  };

  useEffect(() => {
    if (!isExiting) {
      setExitActive(false);
      return;
    }

    const frame = requestAnimationFrame(() => setExitActive(true));
    return () => cancelAnimationFrame(frame);
  }, [isExiting]);

  const handleTransitionEnd = (event: TransitionEvent<HTMLDivElement>) => {
    if (!isExiting || event.propertyName !== "opacity") return;
    if (event.target !== event.currentTarget) return;
    onExitAnimationEnd(item.id);
  };

  return (
    <div
      ref={rowRef}
      style={{
        ...rowStyle,
        ...(isExiting && !prefersReducedMotion
          ? { transitionDuration: `${COMPLETE_EXIT_MS}ms` }
          : undefined),
      }}
      onTransitionEnd={handleTransitionEnd}
      {...rowDragProps}
      aria-label={canDrag ? `Reorder ${label}` : undefined}
      className={cn(
        "group relative flex min-h-[3.5rem] items-center gap-2 rounded-xl border bg-card px-3 py-2.5 shadow-sm dark:border-muted-foreground/20 dark:bg-muted/80 dark:shadow-lg dark:shadow-black/25",
        canDrag &&
          "cursor-grab touch-none transition-[border-color,box-shadow,background-color] duration-150 ease-out active:cursor-grabbing motion-reduce:transition-none dark:hover:bg-muted",
        isDragging && "z-10 scale-[0.98] opacity-50",
        isExiting &&
          "pointer-events-none will-change-[opacity,transform] transition-[opacity,transform] ease-out motion-reduce:transition-none",
        isExiting && exitActive && "opacity-0 scale-[0.97] -translate-y-1",
        isComplete && !isDragging && "opacity-80",
        !isExiting &&
          !isDragging &&
          "border-border/60 hover:border-border hover:bg-accent/20"
      )}
    >
      <div className="flex w-5 shrink-0 items-center justify-center" aria-hidden="true">
        {canDrag ? (
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        ) : null}
      </div>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled={isExiting}
        className="h-9 w-9 shrink-0 cursor-pointer active:scale-[0.97] transition-transform ease-out will-change-transform hover:bg-transparent hover:text-current motion-reduce:transition-none motion-reduce:active:scale-100"
        onPointerDown={stopRowDrag}
        onClick={(event) => {
          event.stopPropagation();
          if (isComplete) {
            onReopen(item.id);
          } else if (!isExiting) {
            onStartComplete(item.id);
          }
        }}
        aria-label={isComplete ? `Reopen ${label}` : `Complete ${label}`}
      >
        {showCompletedCheck ? (
          <Check className="h-4 w-4 text-green-600 transition-colors duration-100 ease-out motion-reduce:transition-none dark:text-green-400" />
        ) : (
          <Clock className="h-4 w-4 text-muted-foreground transition-colors duration-100 ease-out motion-reduce:transition-none" />
        )}
      </Button>

      <div className="flex min-w-0 flex-1 items-center gap-1.5">
        <p
          className={cn(
            "min-w-0 flex-1 truncate text-sm font-medium leading-snug text-foreground transition-opacity duration-100 ease-out motion-reduce:transition-none",
            showCompletedCheck && "line-through opacity-60"
          )}
        >
          {label}
        </p>
        <FocusItemSubitemTrigger
          item={item}
          label={label}
          subitems={subitems}
          description={description}
          className="shrink-0"
        />
      </div>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        onPointerDown={stopRowDrag}
        onClick={() => onRemove(item.id)}
        className="h-9 w-9 shrink-0 cursor-pointer text-muted-foreground/50 opacity-0 transition-[opacity,color,background-color] duration-150 group-hover:opacity-100 hover:bg-muted/80 hover:text-destructive focus-visible:opacity-100 motion-reduce:transition-none"
        aria-label={`Remove ${label}`}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
