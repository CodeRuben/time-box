"use client";

import { useEffect, useState, type FormEvent } from "react";
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

interface AddBookTagDialogProps {
  open: boolean;
  isUpdating: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (name: string) => Promise<void>;
}

export function AddBookTagDialog({
  open,
  isUpdating,
  onOpenChange,
  onAdd,
}: AddBookTagDialogProps) {
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(85vh,42rem)] flex-col overflow-hidden p-0 gap-0 sm:max-w-lg">
        <form onSubmit={(event) => void handleSubmit(event)} className="flex min-h-0 flex-1 flex-col">
          <DialogHeader className="px-6 pt-6 pb-4">
            <DialogTitle>Add tag</DialogTitle>
            <DialogDescription>
              Add a tag to this book. You can add more before closing.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 px-6 pb-6">
            <Label htmlFor="add-book-tag-name">Tag name</Label>
            <Input
              id="add-book-tag-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. fiction"
              disabled={isUpdating}
              maxLength={MAX_BOOK_TAG_NAME_LENGTH}
              autoComplete="off"
            />
            {isUpdating ? (
              <p role="status" className="text-sm text-muted-foreground">
                Saving tag...
              </p>
            ) : null}
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
