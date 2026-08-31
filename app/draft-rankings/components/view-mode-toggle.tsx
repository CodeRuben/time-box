"use client";

import { LayoutGrid, List } from "lucide-react";

import { Button } from "@/components/ui/button";

interface ViewModeToggleProps {
  compact: boolean;
  onToggle: () => void;
}

export function ViewModeToggle({
  compact,
  onToggle,
}: ViewModeToggleProps) {
  return (
    <Button
      type="button"
      size="sm"
      variant={compact ? "default" : "outline"}
      aria-pressed={compact}
      aria-label={compact ? "Switch to board view" : "Switch to compact view"}
      onClick={onToggle}
    >
      {compact ? <List aria-hidden /> : <LayoutGrid aria-hidden />}
      {compact ? "Compact" : "Board"}
    </Button>
  );
}
