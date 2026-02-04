"use client";

import { useState, useEffect, useMemo, useCallback, memo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, Clock, X, Plus, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDropZone } from "@/lib/use-drag-drop";
import { useItemEditing } from "@/lib/use-item-editing";
import { useNewItem } from "@/lib/use-new-item";
import { MAX_VISIBLE_CHIPS, formatTimeSlot } from "@/app/planner/constants";
import type { HourlyItem, TaskStatus } from "@/lib/use-planner-storage";
import type { Reminder } from "@/lib/use-reminder-storage";

interface TimeSlotCardProps {
  items: HourlyItem[];
  reminders: Reminder[];
  onUpdateItems: (items: HourlyItem[]) => void;
  onViewReminder?: (reminder: Reminder) => void;
  timeSlot?: string;
}

const StatusIcon = ({ status }: { status: TaskStatus }) => {
  switch (status) {
    case "completed":
      return (
        <Check className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
      );
    case "error":
      return <X className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />;
    case "pending":
    default:
      return <Clock className="h-3.5 w-3.5 text-muted-foreground" />;
  }
};

interface ItemChipProps {
  item: HourlyItem;
}

const ItemChip = memo(({ item }: ItemChipProps) => (
  <span
    className={cn(
      "inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-muted max-w-full",
      item.status === "completed" && "line-through opacity-60",
      item.status === "error" &&
        "line-through opacity-60 bg-red-100 dark:bg-red-900/30"
    )}
  >
    <span className="truncate max-w-32">{item.text || "Untitled"}</span>
  </span>
));
ItemChip.displayName = "ItemChip";

interface ReminderChipProps {
  reminder: Reminder;
}

const ReminderChip = memo(({ reminder }: ReminderChipProps) => (
  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 max-w-full">
    <Bell className="h-3 w-3 shrink-0" />
    <span className="truncate max-w-28">{reminder.title}</span>
  </span>
));
ReminderChip.displayName = "ReminderChip";

interface CompletionCounterProps {
  completedCount: number;
  totalCount: number;
}

const CompletionCounter = memo(
  ({ completedCount, totalCount }: CompletionCounterProps) => (
    <span
      className={cn(
        "text-xs font-medium tabular-nums",
        completedCount === totalCount
          ? "text-green-600 dark:text-green-400"
          : "text-muted-foreground"
      )}
    >
      {completedCount}/{totalCount}
    </span>
  )
);
CompletionCounter.displayName = "CompletionCounter";

interface AddItemInputProps {
  value: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onChange: (value: string) => void;
  onAdd: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}

const AddItemInput = ({
  value,
  inputRef,
  onChange,
  onAdd,
  onKeyDown,
}: AddItemInputProps) => (
  <div className="flex gap-2">
    <Input
      ref={inputRef}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={onKeyDown}
      placeholder="Add new item..."
      className="h-8 text-sm flex-1"
    />
    <Button
      type="button"
      size="sm"
      onClick={onAdd}
      disabled={!value.trim()}
      className="h-8 px-2"
    >
      <Plus className="h-4 w-4" />
    </Button>
  </div>
);

interface ReminderEntryProps {
  reminder: Reminder;
  onView?: (reminder: Reminder) => void;
}

const ReminderEntry = memo(({ reminder, onView }: ReminderEntryProps) => (
  <div
    className={cn(
      "px-2.5 py-1.5 rounded-md bg-muted/50 hover:bg-muted transition-colors",
      onView && "cursor-pointer"
    )}
    onClick={() => onView?.(reminder)}
  >
    <div className="text-sm font-medium">{reminder.title}</div>
    {reminder.description && (
      <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
        {reminder.description}
      </div>
    )}
  </div>
));
ReminderEntry.displayName = "ReminderEntry";

interface TimeSlotItemProps {
  item: HourlyItem;
  isEditing: boolean;
  editText: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onEditTextChange: (text: string) => void;
  onStartEdit: (item: HourlyItem, e: React.MouseEvent) => void;
  onBlur: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onCycleStatus: (itemId: string, e: React.MouseEvent) => void;
  onDelete: (itemId: string, e: React.MouseEvent) => void;
}

const TimeSlotItem = memo(
  ({
    item,
    isEditing,
    editText,
    inputRef,
    onEditTextChange,
    onStartEdit,
    onBlur,
    onKeyDown,
    onCycleStatus,
    onDelete,
  }: TimeSlotItemProps) => (
    <div className="flex items-center gap-2 py-1 px-1 rounded hover:bg-accent/50 group">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-6 w-6 shrink-0"
        onClick={(e) => onCycleStatus(item.id, e)}
        aria-label={`Cycle status for ${item.text}`}
      >
        <StatusIcon status={item.status} />
      </Button>

      {isEditing ? (
        <Input
          ref={inputRef}
          value={editText}
          onChange={(e) => onEditTextChange(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={onBlur}
          className="h-7 text-sm flex-1"
          placeholder="Item text"
        />
      ) : (
        <span
          onClick={(e) => onStartEdit(item, e)}
          className={cn(
            "text-sm flex-1 cursor-text hover:bg-accent rounded px-1.5 py-0.5",
            item.status === "completed" && "line-through opacity-60",
            item.status === "error" && "line-through opacity-60"
          )}
        >
          {item.text || "Untitled item"}
        </span>
      )}

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
        onClick={(e) => onDelete(item.id, e)}
        aria-label="Delete item"
      >
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  )
);
TimeSlotItem.displayName = "TimeSlotItem";

export function TimeSlotCard({
  items,
  reminders,
  onUpdateItems,
  onViewReminder,
  timeSlot,
}: TimeSlotCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Custom hooks for item management
  const itemEditing = useItemEditing(items, onUpdateItems);
  const newItem = useNewItem(items, onUpdateItems);

  // Memoized computed values
  const {
    completedCount,
    totalCount,
    hasItems,
    reminderCount,
    hasContent,
    visibleItemChips,
    visibleReminderChips,
    overflowCount,
  } = useMemo(() => {
    const completedCount = items.filter((i) => i.status === "completed").length;
    const totalCount = items.length;
    const hasItems = totalCount > 0;
    const reminderCount = reminders.length;
    const hasContent = hasItems || reminderCount > 0;

    const visibleItemChips = items.slice(0, MAX_VISIBLE_CHIPS);
    const remainingSlots = MAX_VISIBLE_CHIPS - visibleItemChips.length;
    const visibleReminderChips = reminders.slice(
      0,
      Math.max(0, remainingSlots)
    );
    const overflowCount = Math.max(
      0,
      totalCount + reminderCount - MAX_VISIBLE_CHIPS
    );

    return {
      completedCount,
      totalCount,
      hasItems,
      reminderCount,
      hasContent,
      visibleItemChips,
      visibleReminderChips,
      overflowCount,
    };
  }, [items, reminders]);

  // Handle drag-and-drop
  const handleDrop = useCallback(
    (text: string) => {
      const newItem: HourlyItem = {
        id: crypto.randomUUID(),
        text: text.trim(),
        status: "pending",
      };
      onUpdateItems([...items, newItem]);
      setIsOpen(true);
    },
    [items, onUpdateItems]
  );

  const { isDragOver, dropZoneProps } = useDropZone({ onDrop: handleDrop });

  // Focus new item input when popover opens
  useEffect(() => {
    if (isOpen && newItem.inputRef.current) {
      newItem.inputRef.current.focus();
    }
  }, [isOpen, newItem.inputRef]);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div
          className={cn(
            "p-2 py-3 rounded-lg border bg-card cursor-pointer transition-all hover:bg-accent/30",
            isDragOver &&
              "ring-2 ring-primary ring-offset-2 ring-offset-background"
          )}
          {...dropZoneProps}
        >
          {/* Chips area */}
          <div className="flex flex-wrap items-center gap-1">
            {hasContent ? (
              <>
                {/* Item chips */}
                {visibleItemChips.map((item) => (
                  <ItemChip key={item.id} item={item} />
                ))}
                {/* Reminder chips */}
                {visibleReminderChips.map((reminder) => (
                  <ReminderChip key={reminder.id} reminder={reminder} />
                ))}
                {overflowCount > 0 && (
                  <span className="inline-flex items-center px-2 py-0.5 text-xs rounded-full bg-muted text-muted-foreground">
                    +{overflowCount}
                  </span>
                )}
                {/* Spacer */}
                <span className="flex-1" />
                {/* Completion counter (only show if there are items) */}
                {hasItems && (
                  <CompletionCounter
                    completedCount={completedCount}
                    totalCount={totalCount}
                  />
                )}
              </>
            ) : (
              <span className="text-xs text-muted-foreground">
                {timeSlot ? formatTimeSlot(timeSlot) : ""}
              </span>
            )}
          </div>
        </div>
      </PopoverTrigger>

      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-3 space-y-3">
          {/* Add new item input */}
          <AddItemInput
            value={newItem.newItemText}
            inputRef={newItem.inputRef}
            onChange={newItem.setNewItemText}
            onAdd={newItem.handleAdd}
            onKeyDown={newItem.handleKeyDown}
          />

          {/* Items List */}
          {hasItems && (
            <div className="space-y-1 max-h-[200px] overflow-y-auto">
              {items.map((item) => (
                <TimeSlotItem
                  key={item.id}
                  item={item}
                  isEditing={itemEditing.editingItemId === item.id}
                  editText={itemEditing.editItemText}
                  inputRef={itemEditing.inputRef}
                  onEditTextChange={itemEditing.setEditItemText}
                  onStartEdit={itemEditing.handleStartEdit}
                  onBlur={itemEditing.handleBlur}
                  onKeyDown={itemEditing.handleKeyDown}
                  onCycleStatus={itemEditing.handleCycleStatus}
                  onDelete={itemEditing.handleDelete}
                />
              ))}
            </div>
          )}

          {/* Reminders Section (readonly) */}
          {reminderCount > 0 && (
            <div className="space-y-2 pt-2 border-t">
              <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                <Bell className="h-3.5 w-3.5" />
                Reminders
              </div>
              <div className="space-y-1.5 max-h-[120px] overflow-y-auto">
                {reminders.map((reminder) => (
                  <ReminderEntry
                    key={reminder.id}
                    reminder={reminder}
                    onView={onViewReminder}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
