"use client";

import { ListFilter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { BookTag } from "@/lib/reading-journal-types";

interface BookTagFilterProps {
  tags: BookTag[];
  selectedKeys: string[];
  onToggle: (key: string) => void;
  onClear: () => void;
}

export function BookTagFilter({
  tags,
  selectedKeys,
  onToggle,
  onClear,
}: BookTagFilterProps) {
  if (tags.length === 0) {
    return null;
  }

  const selectedCount = selectedKeys.length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="relative overflow-visible"
          aria-label={
            selectedCount === 0
              ? "Filter by tags"
              : `Filter by tags, ${selectedCount} selected`
          }
        >
          <ListFilter className="size-4" />
          {selectedCount > 0 ? (
            <span className="absolute -top-1.5 -right-1.5 inline-flex min-w-4 items-center justify-center rounded-full bg-foreground px-1 text-[10px] font-medium leading-4 text-background tabular-nums">
              {selectedCount}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-56 p-0">
        <ul className="max-h-64 overflow-y-auto p-1">
          {tags.map((tag) => {
            const selected = selectedKeys.includes(tag.key);
            const id = `book-tag-filter-${tag.key}`;

            return (
              <li key={tag.key}>
                <Label
                  htmlFor={id}
                  className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 font-normal hover:bg-accent"
                >
                  <Checkbox
                    id={id}
                    checked={selected}
                    onCheckedChange={() => onToggle(tag.key)}
                  />
                  {tag.name}
                </Label>
              </li>
            );
          })}
        </ul>
        <div className="border-t p-1">
          <button
            type="button"
            className="flex w-full items-center rounded-sm px-2 py-1.5 text-sm hover:bg-accent disabled:pointer-events-none disabled:opacity-50"
            onClick={onClear}
            disabled={selectedCount === 0}
          >
            Clear
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
