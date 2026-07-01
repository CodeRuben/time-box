"use client";

import { Button } from "@/components/ui/button";

interface RightColumnViewToggleProps {
  value: "queue" | "hourly";
  onChange: (value: "queue" | "hourly") => void;
}

export function RightColumnViewToggle({
  value,
  onChange,
}: RightColumnViewToggleProps) {
  return (
    <div
      className="inline-flex rounded-lg border bg-muted/30 p-0.5"
      role="group"
      aria-label="Right column view"
    >
      <Button
        type="button"
        variant={value === "queue" ? "secondary" : "ghost"}
        size="sm"
        className="h-8 px-3"
        onClick={() => onChange("queue")}
      >
        Focus
      </Button>
      <Button
        type="button"
        variant={value === "hourly" ? "secondary" : "ghost"}
        size="sm"
        className="h-8 px-3"
        onClick={() => onChange("hourly")}
      >
        Hourly
      </Button>
    </div>
  );
}
