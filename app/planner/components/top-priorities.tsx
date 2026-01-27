"use client";

import { InputWithStatus } from "@/components/ui/input-with-status";

interface TopPrioritiesProps {
  priorities: string[];
  onPriorityChange: (index: number, value: string) => void;
  completed: boolean[];
  onToggleCompletion: (index: number) => void;
}

export function TopPriorities({
  priorities,
  onPriorityChange,
  completed,
  onToggleCompletion,
}: TopPrioritiesProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold text-foreground">Top Priorities</h2>
      <div className="space-y-3">
        {[0, 1, 2].map((index) => (
          <InputWithStatus
            key={index}
            value={priorities[index]}
            onChange={(value) => onPriorityChange(index, value)}
            placeholder={`Priority ${index + 1}`}
            completed={completed[index] || false}
            onToggleCompletion={() => onToggleCompletion(index)}
          />
        ))}
      </div>
    </div>
  );
}
