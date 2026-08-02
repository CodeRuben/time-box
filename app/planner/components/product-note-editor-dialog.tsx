"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DEFAULT_PRODUCT_AREA,
  PRODUCT_AREAS,
  PRODUCT_AREA_LABELS,
  isProductArea,
  type ProductArea,
  type ProductNoteCreateInput,
  type ProductNoteDto,
} from "@/lib/product-notes/types";

interface ProductNoteEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  note?: ProductNoteDto | null;
  onSave: (input: ProductNoteCreateInput) => Promise<void>;
}

export function ProductNoteEditorDialog({
  open,
  onOpenChange,
  note,
  onSave,
}: ProductNoteEditorDialogProps) {
  const isEditing = Boolean(note);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [productArea, setProductArea] =
    useState<ProductArea>(DEFAULT_PRODUCT_AREA);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    setTitle(note?.title ?? "");
    setDescription(note?.description ?? "");
    setProductArea(note?.productArea ?? DEFAULT_PRODUCT_AREA);
    setError(null);
    setIsSaving(false);
  }, [open, note]);

  const handleSave = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError("Title is required");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await onSave({
        title: trimmedTitle,
        description: description.trim(),
        productArea,
      });
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save note");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit note" : "Create note"}</DialogTitle>
          <DialogDescription>
            Capture a product idea tagged to a fixed area of the app.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="product-note-title">Title</Label>
            <Input
              id="product-note-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Short summary of the idea"
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="product-note-description">Description</Label>
            <Textarea
              id="product-note-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Optional details"
              rows={5}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="product-note-area">Product area</Label>
            <Select
              value={productArea}
              onValueChange={(value) => {
                if (isProductArea(value)) {
                  setProductArea(value);
                }
              }}
            >
              <SelectTrigger id="product-note-area" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRODUCT_AREAS.map((area) => (
                  <SelectItem key={area} value={area}>
                    {PRODUCT_AREA_LABELS[area]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => void handleSave()}
            disabled={isSaving}
            className="active:scale-[0.97] ease-out will-change-transform motion-reduce:transition-none motion-reduce:active:scale-100"
          >
            {isSaving ? "Saving…" : isEditing ? "Save" : "Create note"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
