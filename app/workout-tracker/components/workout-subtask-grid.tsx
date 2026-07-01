"use client";

import { X } from "lucide-react";
import type { WorkoutSubtask } from "@/lib/use-workout-storage";
import {
  getColumnInputMode,
  getGridLayout,
  getGridTemplateColumns,
  normalizeSubtaskFields,
  seedSubtaskFields,
} from "@/lib/workout-grid-layouts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface WorkoutSubtaskGridProps {
  layoutId: string;
  subtasks: WorkoutSubtask[];
  onSubtaskFieldsChange: (
    subtaskId: string,
    fields: Record<string, string>,
  ) => void;
  onDeleteSubtask: (subtaskId: string) => void;
}

const CELL_INPUT_CLASS =
  "h-8 rounded-none border-0 bg-transparent px-2 text-sm shadow-none focus-visible:ring-0 sm:px-3";

function DeleteSubtaskButton({ onDelete }: { onDelete: () => void }) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="absolute -right-1.5 -top-1.5 z-10 size-6 rounded-full border bg-background opacity-100 shadow-sm transition-opacity sm:opacity-0 sm:group-hover/subtask:opacity-100 sm:group-focus-within/subtask:opacity-100"
      onClick={onDelete}
      aria-label="Delete sub item"
    >
      <X className="size-3" />
    </Button>
  );
}

export function WorkoutSubtaskGridHeader({ layoutId }: { layoutId: string }) {
  const layout = getGridLayout(layoutId);

  return (
    <div
      className="grid border-b bg-muted/40 px-1 py-2 text-center text-[11px] font-medium text-muted-foreground sm:px-2"
      style={{ gridTemplateColumns: getGridTemplateColumns(layoutId) }}
    >
      {layout.columns.map((column, index) => (
        <span
          key={column.id}
          className={cn(index === 0 && column.width === "flex" && "text-left")}
        >
          {column.label}
        </span>
      ))}
    </div>
  );
}

function WorkoutSubtaskGridRow({
  layoutId,
  subtask,
  onFieldsChange,
  onDelete,
}: {
  layoutId: string;
  subtask: WorkoutSubtask;
  onFieldsChange: (fields: Record<string, string>) => void;
  onDelete: () => void;
}) {
  const layout = getGridLayout(layoutId);
  const fields = normalizeSubtaskFields(
    subtask.fields ?? seedSubtaskFields(subtask.name, layoutId),
    layoutId,
  );

  const updateField = (columnId: string, value: string) => {
    onFieldsChange({
      ...fields,
      [columnId]: value,
    });
  };

  return (
    <div className="group/subtask relative">
      <DeleteSubtaskButton onDelete={onDelete} />

      <div
        className="grid items-center bg-background"
        style={{ gridTemplateColumns: getGridTemplateColumns(layoutId) }}
      >
        {layout.columns.map((column, index) => (
          <Input
            key={column.id}
            value={fields[column.id] ?? ""}
            onChange={(event) => updateField(column.id, event.target.value)}
            placeholder={column.placeholder}
            inputMode={getColumnInputMode(column.kind)}
            className={cn(
              CELL_INPUT_CLASS,
              index > 0 && "border-l",
              column.width === "flex" ? "text-left" : "text-center",
            )}
          />
        ))}
      </div>
    </div>
  );
}

export function WorkoutSubtaskGrid({
  layoutId,
  subtasks,
  onSubtaskFieldsChange,
  onDeleteSubtask,
}: WorkoutSubtaskGridProps) {
  if (subtasks.length === 0) {
    return null;
  }

  return (
    <div className="overflow-hidden rounded-lg border bg-background">
      <WorkoutSubtaskGridHeader layoutId={layoutId} />
      <div className="divide-y">
        {subtasks.map((subtask) => (
          <WorkoutSubtaskGridRow
            key={subtask.id}
            layoutId={layoutId}
            subtask={subtask}
            onFieldsChange={(fields) => onSubtaskFieldsChange(subtask.id, fields)}
            onDelete={() => onDeleteSubtask(subtask.id)}
          />
        ))}
      </div>
    </div>
  );
}
