"use client";

import { Button } from "@/components/ui/button";

interface DraftModeToggleProps {
  enabled: boolean;
  takenCount: number;
  availableCount: number;
  onToggle: () => void;
}

export function DraftModeToggle({
  enabled,
  takenCount,
  availableCount,
  onToggle,
}: DraftModeToggleProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        type="button"
        size="sm"
        variant={enabled ? "default" : "outline"}
        aria-pressed={enabled}
        onClick={onToggle}
      >
        Live draft
      </Button>
      {enabled ? (
        <p className="text-sm text-muted-foreground">
          {availableCount} available · {takenCount} taken
        </p>
      ) : null}
    </div>
  );
}
