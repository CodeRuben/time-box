"use client";

import { useState, type DragEvent } from "react";
import { Check, ChevronRight, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import type { FocusItemStatus, FocusListItem, FocusListSubitem } from "@/lib/focus-list";
import {
  completeRowEnterAnimation,
  completeSectionCollapsibleAnimation,
  STATUS_LABELS,
} from "./constants";
import { FocusItemSubitemTrigger } from "./focus-item-subitem-trigger";

interface CompleteRowProps {
  item: FocusListItem;
  label: string;
  subitems: FocusListSubitem[];
  description?: string;
  isDropTarget: boolean;
  isEntering?: boolean;
  onReopen: (itemId: string) => void;
  onRemove: (itemId: string) => void;
  onDragEnter: () => void;
  onDrop: (event: DragEvent) => void;
}

function CompleteRow({
  item,
  label,
  subitems,
  description,
  isDropTarget,
  isEntering = false,
  onReopen,
  onRemove,
  onDragEnter,
  onDrop,
}: CompleteRowProps) {
  return (
    <div
      onDragEnter={onDragEnter}
      onDragOver={(event) => event.preventDefault()}
      onDrop={onDrop}
      className={cn(
        "group flex items-center gap-2.5 rounded-md px-2 py-1.5 transition-colors duration-150 ease-out motion-reduce:transition-none",
        isEntering && completeRowEnterAnimation,
        isDropTarget ? "bg-primary/[0.06]" : "hover:bg-muted/50"
      )}
    >
      <button
        type="button"
        onClick={() => onReopen(item.id)}
        aria-label={`Reopen ${label}`}
        className="flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded-full bg-green-500/15 text-green-600 transition-transform duration-100 ease-out will-change-transform active:scale-90 motion-reduce:transition-none dark:bg-green-400/10 dark:text-green-400"
      >
        <Check className="h-3 w-3" />
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-1.5">
          <p className="min-w-0 flex-1 truncate text-sm capitalize text-muted-foreground">
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
      </div>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => onRemove(item.id)}
        className="h-6 w-6 shrink-0 text-muted-foreground/50 opacity-0 transition-[opacity,color,background-color] duration-150 group-hover:opacity-100 hover:bg-muted hover:text-destructive focus-visible:opacity-100 motion-reduce:transition-none"
        aria-label={`Remove ${label}`}
      >
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

interface CompleteSectionProps {
  items: FocusListItem[];
  getItemLabel: (item: FocusListItem) => string;
  getItemSubitems: (item: FocusListItem) => FocusListSubitem[];
  getItemDescription?: (item: FocusListItem) => string | undefined;
  enteringCompleteIds: Set<string>;
  dropTargetIndex: number | null;
  onDropAtIndex: (status: FocusItemStatus, index: number, event: DragEvent) => void;
  onDragEnterIndex: (index: number) => void;
  onReopen: (itemId: string) => void;
  onRemove: (itemId: string) => void;
}

export function CompleteSection({
  items,
  getItemLabel,
  getItemSubitems,
  getItemDescription,
  enteringCompleteIds,
  dropTargetIndex,
  onDropAtIndex,
  onDragEnterIndex,
  onReopen,
  onRemove,
}: CompleteSectionProps) {
  const [open, setOpen] = useState(true);

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="mt-auto shrink-0"
    >
      <section aria-label="Completed column">
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex w-full cursor-pointer items-center gap-2 border-t border-border/60 pt-2.5 pb-2 text-left transition-colors duration-150 ease-out motion-reduce:transition-none"
          >
            <h3 className="text-sm font-semibold text-muted-foreground">
              {STATUS_LABELS.complete}
            </h3>
            <span className="rounded-full bg-muted/80 px-2 py-0.5 text-[11px] font-medium tabular-nums text-muted-foreground">
              {items.length}
            </span>
            <ChevronRight
              className={cn(
                "ml-auto h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-150 ease-in-out motion-reduce:transition-none",
                open && "rotate-90"
              )}
            />
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent className={completeSectionCollapsibleAnimation}>
          {items.length === 0 ? (
            <p className="px-2 py-2 text-xs text-muted-foreground/80">
              Nothing completed yet.
            </p>
          ) : (
            <div
              className="max-h-56 space-y-0.5 overflow-y-auto scrollbar-themed pr-0.5"
              onDragEnter={() => onDragEnterIndex(0)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => onDropAtIndex("complete", 0, event)}
            >
              {items.map((item, index) => (
                <CompleteRow
                  key={item.id}
                  item={item}
                  label={getItemLabel(item)}
                  subitems={getItemSubitems(item)}
                  description={getItemDescription?.(item)}
                  isDropTarget={dropTargetIndex === index}
                  isEntering={enteringCompleteIds.has(item.id)}
                  onReopen={onReopen}
                  onRemove={onRemove}
                  onDragEnter={() => onDragEnterIndex(index)}
                  onDrop={(event) => onDropAtIndex("complete", index, event)}
                />
              ))}
            </div>
          )}
        </CollapsibleContent>
      </section>
    </Collapsible>
  );
}
