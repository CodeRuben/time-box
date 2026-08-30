"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { BookTag } from "@/lib/reading-journal-types";
import { AddBookTagDialog } from "./add-book-tag-dialog";

interface BookTagsProps {
  tags: BookTag[];
  isUpdating: boolean;
  onAdd: (name: string) => Promise<void>;
  onRemove: (tag: BookTag) => Promise<void>;
}

export function BookTags({
  tags,
  isUpdating,
  onAdd,
  onRemove,
}: BookTagsProps) {
  const [addOpen, setAddOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRemove(tag: BookTag) {
    setError(null);
    try {
      await onRemove(tag);
    } catch {
      setError("Couldn't remove this tag. Try again.");
    }
  }

  return (
    <section aria-label="Tags" className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        {tags.length === 0 ? (
          <p className="text-sm text-muted-foreground">No tags yet.</p>
        ) : (
          tags.map((tag) => (
            <Badge key={tag.key} variant="secondary" className="gap-0.5 pr-1">
              {tag.name}
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="size-5 rounded-full"
                onClick={() => void handleRemove(tag)}
                disabled={isUpdating}
                aria-label={`Remove ${tag.name} tag`}
              >
                <X className="size-3" />
              </Button>
            </Badge>
          ))
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 border-dashed"
          onClick={() => setAddOpen(true)}
          disabled={isUpdating && !addOpen}
        >
          <Plus className="size-3.5" />
          Add tag
        </Button>
      </div>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <AddBookTagDialog
        open={addOpen}
        isUpdating={isUpdating}
        onOpenChange={setAddOpen}
        onAdd={onAdd}
      />
    </section>
  );
}
