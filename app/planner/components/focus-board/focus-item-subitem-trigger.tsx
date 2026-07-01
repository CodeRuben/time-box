"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";
import type { FocusListItem, FocusListSubitem } from "@/lib/focus-list";
import { getFocusSourceTypeLabel } from "./constants";
import { FocusItemDetailsDialog } from "./focus-item-details-dialog";

interface FocusItemSubitemTriggerProps {
  item: FocusListItem;
  label: string;
  subitems: FocusListSubitem[];
  description?: string;
  className?: string;
}

export function FocusItemSubitemTrigger({
  item,
  label,
  subitems,
  description,
  className,
}: FocusItemSubitemTriggerProps) {
  const [open, setOpen] = useState(false);
  const typeLabel = getFocusSourceTypeLabel(item.source.type);

  if (subitems.length > 0) {
    return (
      <>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            setOpen(true);
          }}
          onMouseDown={(event) => event.stopPropagation()}
          className={cn(
            "rounded-full bg-muted/80 py-0.5 pr-1.5 pl-0 text-[11px] font-medium tabular-nums text-muted-foreground transition-colors duration-150 ease-out hover:bg-muted hover:text-foreground motion-reduce:transition-none",
            className
          )}
          aria-label={`View ${subitems.length} sub-item${subitems.length === 1 ? "" : "s"} for ${label}`}
        >
          {subitems.length} sub-item{subitems.length === 1 ? "" : "s"}
        </button>

        <FocusItemDetailsDialog
          open={open}
          onOpenChange={setOpen}
          label={label}
          sourceType={item.source.type}
          subitems={subitems}
          description={description}
        />
      </>
    );
  }

  if (item.source.type === "brain_dump") {
    return null;
  }

  return (
    <p className={cn("text-xs font-medium text-muted-foreground", className)}>
      {typeLabel}
    </p>
  );
}
