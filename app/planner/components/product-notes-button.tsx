"use client";

import { StickyNote } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProductNotesButtonProps {
  onClick: () => void;
}

export function ProductNotesButton({ onClick }: ProductNotesButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className="h-9 w-9"
      aria-label="Product notes"
      onClick={onClick}
    >
      <StickyNote className="h-5 w-5" />
    </Button>
  );
}
