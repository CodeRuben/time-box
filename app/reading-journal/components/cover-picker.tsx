"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { BookCoverImage } from "./book-cover-image";
import { useBookCovers } from "../hooks/use-book-covers";

const LANGUAGE_LABELS: Record<string, string> = {
  eng: "English",
  fre: "French",
  fra: "French",
  ger: "German",
  deu: "German",
  spa: "Spanish",
  ita: "Italian",
  por: "Portuguese",
  dut: "Dutch",
  nld: "Dutch",
  rus: "Russian",
  jpn: "Japanese",
  chi: "Chinese",
  zho: "Chinese",
  kor: "Korean",
  fin: "Finnish",
  swe: "Swedish",
  nor: "Norwegian",
  dan: "Danish",
  pol: "Polish",
  ara: "Arabic",
  heb: "Hebrew",
  gre: "Greek",
  tur: "Turkish",
};

function languageLabel(code: string | null): string | null {
  if (!code) return null;
  return LANGUAGE_LABELS[code] ?? code.toUpperCase();
}

interface CoverPickerProps {
  openLibraryKey: string;
  currentCoverUrl: string;
  onSelect: (coverUrl: string) => void;
}

export function CoverPicker({
  openLibraryKey,
  currentCoverUrl,
  onSelect,
}: CoverPickerProps) {
  const [open, setOpen] = useState(false);
  const { options, isLoading, failed } = useBookCovers(openLibraryKey, open);

  if (!openLibraryKey) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="link" className="h-auto p-0 text-sm">
          Browse alternate covers…
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <p className="mb-3 text-sm font-medium">Choose a cover</p>

        {isLoading && (
          <div className="flex items-center justify-center py-6 text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
          </div>
        )}

        {!isLoading && failed && (
          <p className="py-2 text-sm text-muted-foreground">
            Couldn&rsquo;t load alternate covers.
          </p>
        )}

        {!isLoading && !failed && options.length === 0 && (
          <p className="py-2 text-sm text-muted-foreground">
            No alternate covers found for this book.
          </p>
        )}

        {!isLoading && !failed && options.length > 0 && (
          <div className="scrollbar-themed grid max-h-72 grid-cols-4 gap-2 overflow-y-auto">
            {options.map((option) => {
              const isSelected = option.coverUrl === currentCoverUrl;
              const label = languageLabel(option.language);
              return (
                <button
                  key={option.coverId}
                  type="button"
                  onClick={() => {
                    onSelect(option.coverUrl);
                    setOpen(false);
                  }}
                  className={`relative aspect-2/3 overflow-hidden rounded-sm border transition-colors duration-150 ease motion-reduce:transition-none ${
                    isSelected
                      ? "border-primary ring-2 ring-primary"
                      : "border-border hover:border-primary/50"
                  }`}
                  title={label ?? undefined}
                >
                  <BookCoverImage
                    src={option.coverUrl}
                    alt={label ? `Cover option (${label})` : "Cover option"}
                    sizes="72px"
                  />
                  {isSelected && (
                    <span className="absolute top-1 right-1 rounded-full bg-primary p-0.5 text-primary-foreground">
                      <Check className="size-3" />
                    </span>
                  )}
                  {label && (
                    <span className="absolute inset-x-0 bottom-0 truncate bg-black/60 px-1 py-0.5 text-[10px] text-white">
                      {label}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
