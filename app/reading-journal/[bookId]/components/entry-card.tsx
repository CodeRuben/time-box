"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { MoreHorizontal } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { BookEntry } from "@/lib/reading-journal-types";

interface EntryCardProps {
  entry: BookEntry;
  pagesRead: number | null;
  isLast: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

const TEXT_FIELDS: { key: keyof BookEntry; label: string }[] = [
  { key: "summary", label: "Summary" },
  { key: "analysis", label: "Analysis" },
  { key: "thoughts", label: "Thoughts" },
] as const;

const REFLECTION_COLLAPSIBLE_ANIMATION =
  "overflow-hidden data-[state=open]:animate-[collapsible-down_220ms_ease-out-cubic] data-[state=closed]:animate-[collapsible-up_180ms_ease-out-cubic] motion-reduce:animate-none";

function getEntryPreview(entry: BookEntry): string | null {
  for (const field of TEXT_FIELDS) {
    const value = entry[field.key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return null;
}

function formatPageMeta(entry: BookEntry, pagesRead: number | null): string | null {
  const parts: string[] = [];
  if (entry.currentPage !== null) parts.push(`p. ${entry.currentPage}`);
  if (pagesRead) parts.push(`+${pagesRead} pages`);
  return parts.length > 0 ? parts.join(" · ") : null;
}

function TimelineDot({ open }: { open: boolean }) {
  return (
    <span
      className={cn(
        "size-2.5 shrink-0 rounded-full border-2 transition-colors duration-150 ease motion-reduce:transition-none",
        open ? "border-primary bg-primary/30" : "border-border bg-background"
      )}
      aria-hidden
    />
  );
}

function EntryDate({ parsedDate }: { parsedDate: Date }) {
  return (
    <div className="w-7 shrink-0 pt-0.5 text-right tabular-nums">
      <p className="text-base font-semibold leading-none text-foreground">
        {format(parsedDate, "d")}
      </p>
      <p className="mt-1 text-[9px] font-medium uppercase tracking-wider text-muted-foreground">
        {format(parsedDate, "MMM")}
      </p>
    </div>
  );
}

function EntryActionsMenu({
  formattedDate,
  onEdit,
  onDelete,
}: {
  formattedDate: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Entry actions"
            onClick={(event) => event.stopPropagation()}
            onPointerDown={(event) => event.stopPropagation()}
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={onEdit}>Edit</DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => setDeleteOpen(true)}
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete entry</AlertDialogTitle>
            <AlertDialogDescription>
              Delete the entry for {formattedDate}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={onDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function EntryCard({
  entry,
  pagesRead,
  isLast,
  onEdit,
  onDelete,
}: EntryCardProps) {
  const [open, setOpen] = useState(false);
  const parsedDate = parseISO(entry.date);
  const preview = getEntryPreview(entry);
  const pageMeta = formatPageMeta(entry, pagesRead);
  const hasTextContent = preview !== null;
  const formattedDate = format(parsedDate, "EEEE, MMMM d");

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="relative pb-6">
        {!isLast && (
          <span
            className="absolute bottom-0 left-1.5 top-[calc(0.375rem+0.625rem+0.25rem)] w-px bg-border/70"
            aria-hidden
          />
        )}

        <div className="relative flex gap-4">
          {hasTextContent ? (
            <CollapsibleTrigger asChild>
              <button
                type="button"
                aria-expanded={open}
                aria-label={`${open ? "Collapse" : "Expand"} reflection for ${formattedDate}`}
                className="flex min-w-0 flex-1 cursor-pointer gap-4 rounded-sm pr-9 text-left transition-colors duration-150 ease hover:bg-muted/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2 motion-reduce:transition-none"
              >
                <div className="flex shrink-0 gap-1.5">
                  <div className="flex w-3 shrink-0 justify-center pt-1.5">
                    <TimelineDot open={open} />
                  </div>
                  <EntryDate parsedDate={parsedDate} />
                </div>

                <div className="min-w-0 flex-1 space-y-1 pl-[1em]">
                  {pageMeta && (
                    <p className="text-[11px] font-medium uppercase tracking-wide text-primary/80">
                      {pageMeta}
                    </p>
                  )}
                  {!open && (
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {preview}
                    </p>
                  )}
                </div>
              </button>
            </CollapsibleTrigger>
          ) : (
            <div className="flex min-w-0 flex-1 gap-4 pr-9">
              <div className="flex shrink-0 gap-1.5">
                <div className="flex w-3 shrink-0 justify-center pt-1.5">
                  <TimelineDot open={false} />
                </div>
                <EntryDate parsedDate={parsedDate} />
              </div>

              <div className="min-w-0 flex-1 space-y-1 pl-[1em]">
                {pageMeta && (
                  <p className="text-[11px] font-medium uppercase tracking-wide text-primary/80">
                    {pageMeta}
                  </p>
                )}
                <p className="text-sm text-muted-foreground">Page logged</p>
              </div>
            </div>
          )}

          <div className="absolute right-0 top-0 z-10">
            <EntryActionsMenu
              formattedDate={formattedDate}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </div>
        </div>

        {hasTextContent && (
          <div className="flex gap-4">
            <div className="flex shrink-0 gap-1.5" aria-hidden>
              <div className="w-3 shrink-0" />
              <div className="w-7 shrink-0" />
            </div>
            <div className="min-w-0 flex-1 pl-[1em]">
              <CollapsibleContent className={REFLECTION_COLLAPSIBLE_ANIMATION}>
                <div className="mt-3 space-y-4 border-l-2 border-primary/25 pl-3 sm:pl-4">
                  {TEXT_FIELDS.map((field) => {
                    const value = entry[field.key];
                    if (!value || typeof value !== "string") return null;
                    return (
                      <div key={field.key}>
                        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          {field.label}
                        </p>
                        <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                          {value}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </CollapsibleContent>
            </div>
          </div>
        )}
      </div>
    </Collapsible>
  );
}
