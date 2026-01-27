"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface InputWithStatusProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  completed: boolean;
  onToggleCompletion: () => void;
  className?: string;
  id?: string;
}

export function InputWithStatus({
  value,
  onChange,
  placeholder,
  completed,
  onToggleCompletion,
  className,
  id,
}: InputWithStatusProps) {
  return (
    <div className={cn("flex items-center", className)}>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn(
          "h-9 w-9 rounded-r-none border border-r-0 border-input shrink-0 cursor-pointer",
          "hover:bg-accent focus-visible:ring-0 focus-visible:ring-offset-0"
        )}
        onClick={onToggleCompletion}
        aria-label={completed ? "Mark as todo" : "Mark as complete"}
      >
        {completed ? (
          <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
        ) : (
          <Clock className="h-4 w-4 text-muted-foreground" />
        )}
      </Button>
      <Input
        id={id}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "flex-1 rounded-l-none",
          completed && "line-through opacity-60"
        )}
      />
    </div>
  );
}
