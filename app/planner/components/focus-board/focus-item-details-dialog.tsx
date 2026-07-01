"use client";

import { Check, Circle } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { FocusListSubitem } from "@/lib/focus-list";
import { getFocusSourceTypeLabel } from "./constants";
import type { FocusItemSource } from "@/lib/focus-item-source";

interface FocusItemDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  label: string;
  sourceType: FocusItemSource["type"];
  subitems: FocusListSubitem[];
  description?: string;
}

export function FocusItemDetailsDialog({
  open,
  onOpenChange,
  label,
  sourceType,
  subitems,
  description,
}: FocusItemDetailsDialogProps) {
  const sourceLabel = getFocusSourceTypeLabel(sourceType);
  const hasCompletionState = subitems.some(
    (subitem) => subitem.completed !== undefined
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{label}</DialogTitle>
          <DialogDescription>
            {sourceType === "brain_dump" ? "From brain dump" : sourceLabel}
          </DialogDescription>
        </DialogHeader>

        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}

        {subitems.length > 0 ? (
          <ul className="space-y-2">
            {subitems.map((subitem, index) => (
              <li
                key={`${subitem.name}-${index}`}
                className="flex items-start gap-2.5 text-sm"
              >
                {hasCompletionState ? (
                  subitem.completed ? (
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600 dark:text-green-400" />
                  ) : (
                    <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/60" />
                  )
                ) : (
                  <span
                    className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/50"
                    aria-hidden="true"
                  />
                )}
                <span
                  className={cn(
                    "min-w-0 flex-1 leading-snug",
                    subitem.completed && "text-muted-foreground line-through"
                  )}
                >
                  {subitem.name}
                </span>
              </li>
            ))}
          </ul>
        ) : null}

        <DialogFooter showCloseButton />
      </DialogContent>
    </Dialog>
  );
}
