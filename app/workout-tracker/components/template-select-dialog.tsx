"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { WorkoutTemplate } from "../constants";
import {
  Dialog,
  DialogContent,
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Choose a template</DialogTitle>
        </DialogHeader>
        <div className="grid gap-2 py-2">
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
                    "rounded-lg border-2 transition-colors",
                    isExpanded
                      ? "border-green-500/60 bg-green-500/10"
                      : "border-transparent bg-muted/30 hover:bg-muted/50",
                  )}
                >
                  <CollapsibleTrigger asChild>
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 px-3 py-3 text-left"
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                      )}
                      <div className="min-w-0 flex-1">
                        <span className="font-medium">{template.name}</span>
                        <span className="text-muted-foreground ml-2 text-xs">
                          {template.exercises.length} exercises
                        </span>
                      </div>
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
                    <ul className="list-inside list-disc space-y-1 border-t border-border/50 px-3 pb-3 pt-2 text-sm text-muted-foreground">
                      {template.exercises.map((exercise, index) => (
                        <li key={index}>{exercise}</li>
                      ))}
                    </ul>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            );
          })}
        </div>
        <div className="flex justify-end">
          <Button
            onClick={handleSelect}
            disabled={!expandedId}
          >
            Select
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
