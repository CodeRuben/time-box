"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import type { WorkoutTemplate } from "../constants";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

interface TemplateSelectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templates: WorkoutTemplate[];
  onSelectTemplate: (templateId: string) => void;
}

export function TemplateSelectDialog({
  open,
  onOpenChange,
  templates,
  onSelectTemplate,
}: TemplateSelectDialogProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setExpandedId(null);
    }
    onOpenChange(isOpen);
  };

  const handleExpandChange = (templateId: string) => (isOpen: boolean) => {
    setExpandedId(isOpen ? templateId : null);
  };

  const handleSelect = () => {
    if (expandedId) {
      onSelectTemplate(expandedId);
      handleOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-lg">
        <div className="border-b border-border/60 bg-muted/15 px-6 py-5 dark:border-border/75 dark:bg-muted/20">
          <DialogHeader className="text-left">
            <DialogTitle className="text-xl font-semibold tracking-tight">
              Choose a template
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="scrollbar-themed max-h-[min(52vh,22rem)] overflow-y-auto bg-muted/5 px-3 py-3 sm:px-4 dark:bg-muted/20">
          <div className="flex flex-col gap-2">
            {templates.map((template) => {
              const isExpanded = expandedId === template.id;
              return (
                <Collapsible
                  key={template.id}
                  open={isExpanded}
                  onOpenChange={handleExpandChange(template.id)}
                >
                  <div
                    className={cn(
                      "overflow-hidden rounded-xl border shadow-sm transition-colors",
                      isExpanded
                        ? "border-emerald-500/35 bg-emerald-500/[0.07] ring-1 ring-emerald-500/15"
                        : "border-border/70 bg-card hover:border-border hover:bg-muted/25",
                    )}
                  >
                    <CollapsibleTrigger asChild>
                      <button
                        type="button"
                        className="flex w-full cursor-pointer items-center gap-3 px-4 py-3.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                      >
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                            <span className="text-sm font-semibold text-foreground">
                              {template.name}
                            </span>
                            <span className="rounded-md bg-muted/80 px-1.5 py-px text-xs font-medium tabular-nums text-muted-foreground">
                              {template.exercises.length}{" "}
                              {template.exercises.length === 1
                                ? "exercise"
                                : "exercises"}
                            </span>
                          </div>
                        </div>
                        {isExpanded && (
                          <Check
                            className="size-5 shrink-0 text-emerald-600 dark:text-emerald-400"
                            strokeWidth={2.5}
                            aria-hidden
                          />
                        )}
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
                      <div className="border-t border-border/60 bg-muted/25 px-4 pb-4 pt-1 dark:border-border/70 dark:bg-muted/30">
                        <p className="mb-2.5 pt-2 text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
                          Exercises
                        </p>
                        <ul className="space-y-2">
                          {template.exercises.map((exercise, index) => (
                            <li
                              key={`${exercise}-${index}`}
                              className="flex gap-3 text-sm leading-snug"
                            >
                              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-background text-xs font-medium text-muted-foreground shadow-sm ring-1 ring-border/50">
                                {index + 1}
                              </span>
                              <span className="min-w-0 flex-1 pt-0.5 text-foreground/90">
                                {exercise}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              );
            })}
          </div>
        </div>

        <DialogFooter className="gap-2 border-t border-border/60 bg-muted/10 px-6 py-4 sm:justify-end dark:border-border/75 dark:bg-muted/15">
          <Button
            type="button"
            onClick={handleSelect}
            disabled={!expandedId}
            className="active:scale-[0.97] ease-out will-change-transform motion-reduce:transition-none motion-reduce:active:scale-100"
          >
            Add workout
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
