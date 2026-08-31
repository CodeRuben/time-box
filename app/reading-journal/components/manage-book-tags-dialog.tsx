"use client";

import { useEffect, useState, type FormEvent } from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MAX_BOOK_TAG_NAME_LENGTH } from "@/lib/book-tags";
import type { BookTag } from "@/lib/reading-journal-types";

interface ManageBookTagsDialogProps {
  open: boolean;
  bookTitle: string;
  tags: BookTag[];
  isUpdating: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (name: string) => Promise<void>;
  onRemove: (tag: BookTag) => Promise<void>;
}

export function ManageBookTagsDialog({
  open,
  bookTitle,
  tags,
  isUpdating,
  onOpenChange,
  onAdd,
  onRemove,
}: ManageBookTagsDialogProps) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setName("");
      setError(null);
    }
  }, [open]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) {
      setError("Enter a tag name.");
      return;
    }

    setError(null);
    try {
      await onAdd(name);
      setName("");
    } catch {
      setError("Couldn't add this tag. Try again.");
    }
  }

  async function handleRemove(tag: BookTag) {
    setError(null);
    try {
      await onRemove(tag);
    } catch {
      setError("Couldn't remove this tag. Try again.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(85vh,42rem)] flex-col overflow-hidden p-0 gap-0 sm:max-w-lg">
        <form
          onSubmit={(event) => void handleSubmit(event)}
          className="flex min-h-0 flex-1 flex-col"
        >
          <DialogHeader className="px-6 pt-6 pb-4">
            <DialogTitle>Tags</DialogTitle>
            <DialogDescription>
              Tags on {bookTitle}. Add more without leaving this page.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 px-6 pb-6">
            <div className="flex min-h-8 flex-wrap content-start gap-2">
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
            </div>
            <div className="space-y-2">
              <Label htmlFor="manage-book-tag-name">New tag</Label>
              <Input
                id="manage-book-tag-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. fiction"
                disabled={isUpdating}
                maxLength={MAX_BOOK_TAG_NAME_LENGTH}
                autoComplete="off"
              />
            </div>
            <p
              role="status"
              className="min-h-5 text-sm text-muted-foreground"
            >
              {isUpdating ? "Saving tag..." : "\u00a0"}
            </p>
            {error ? (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            ) : null}
          </div>
          <DialogFooter className="border-t px-6 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Done
            </Button>
            <Button
              type="submit"
              disabled={isUpdating}
              className="active:scale-[0.97] ease-out will-change-transform motion-reduce:transition-none motion-reduce:active:scale-100"
            >
              Add tag
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
