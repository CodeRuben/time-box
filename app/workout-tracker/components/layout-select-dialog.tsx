"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import {
  GRID_LAYOUT_TEMPLATES,
  getGridTemplateColumns,
  type GridLayoutTemplate,
} from "@/lib/workout-grid-layouts";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LayoutSelectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectLayout: (layoutId: string) => void;
  title?: string;
  confirmLabel?: string;
}

function LayoutPreview({ layout }: { layout: GridLayoutTemplate }) {
  return (
    <div className="overflow-hidden rounded-md border bg-background/80">
      <div
        className="grid border-b bg-muted/50 px-2 py-1.5 text-[10px] font-medium text-muted-foreground"
        style={{ gridTemplateColumns: getGridTemplateColumns(layout.id) }}
      >
        {layout.columns.map((column) => (
          <span key={column.id} className="truncate text-center first:text-left">
            {column.label}
          </span>
        ))}
      </div>
      <div
        className="grid px-2 py-2 text-[10px] text-muted-foreground/80"
        style={{ gridTemplateColumns: getGridTemplateColumns(layout.id) }}
      >
        {layout.columns.map((column) => (
          <span key={column.id} className="truncate text-center first:text-left">
            …
          </span>
        ))}
      </div>
    </div>
  );
}

export function LayoutSelectDialog({
  open,
  onOpenChange,
  onSelectLayout,
  title = "Choose a grid layout",
  confirmLabel = "Use layout",
}: LayoutSelectDialogProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setSelectedId(null);
    }
    onOpenChange(isOpen);
  };

  const handleSelect = () => {
    if (!selectedId) {
      return;
    }

    onSelectLayout(selectedId);
    handleOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-lg">
        <div className="border-b border-border/60 bg-muted/15 px-6 py-5 dark:border-border/75 dark:bg-muted/20">
          <DialogHeader className="text-left">
            <DialogTitle className="text-xl font-semibold tracking-tight">
              {title}
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="scrollbar-themed max-h-[min(52vh,24rem)] overflow-y-auto bg-muted/5 px-3 py-3 sm:px-4 dark:bg-muted/20">
          <div className="flex flex-col gap-2">
            {GRID_LAYOUT_TEMPLATES.map((layout) => {
              const isSelected = selectedId === layout.id;

              return (
                <button
                  key={layout.id}
                  type="button"
                  onClick={() => setSelectedId(layout.id)}
                  className={cn(
                    "rounded-xl border p-4 text-left shadow-sm transition-colors",
                    isSelected
                      ? "border-emerald-500/35 bg-emerald-500/[0.07] ring-1 ring-emerald-500/15"
                      : "border-border/70 bg-card hover:border-border hover:bg-muted/25",
                  )}
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-foreground">
                        {layout.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {layout.description}
                      </p>
                    </div>
                    {isSelected && (
                      <Check
                        className="size-5 shrink-0 text-emerald-600 dark:text-emerald-400"
                        strokeWidth={2.5}
                        aria-hidden
                      />
                    )}
                  </div>
                  <LayoutPreview layout={layout} />
                </button>
              );
            })}
          </div>
        </div>

        <DialogFooter className="gap-2 border-t border-border/60 bg-muted/10 px-6 py-4 sm:justify-end dark:border-border/75 dark:bg-muted/15">
          <Button
            type="button"
            onClick={handleSelect}
            disabled={!selectedId}
            className="active:scale-[0.97] ease-out will-change-transform motion-reduce:transition-none motion-reduce:active:scale-100"
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
