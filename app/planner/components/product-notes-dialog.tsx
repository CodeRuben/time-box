"use client";

import { Fragment, useMemo, useState } from "react";
import { ChevronDown, MoreVertical } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Collapsible,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatNoteUpdatedAt } from "@/lib/product-notes/format";
import {
  filterProductNotes,
  isProductAreaFilter,
  type ProductAreaFilter,
} from "@/lib/product-notes/query";
import {
  PRODUCT_AREAS,
  PRODUCT_AREA_LABELS,
  type ProductNoteCreateInput,
  type ProductNoteDto,
} from "@/lib/product-notes/types";
import { useProductNotes } from "@/lib/use-product-notes";
import { ProductNoteEditorDialog } from "./product-note-editor-dialog";
import { DeleteProductNoteAlert } from "./delete-product-note-alert";
import { cn } from "@/lib/utils";

const NOTE_DESCRIPTION_COLLAPSIBLE =
  "overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up motion-reduce:animate-none";

type DialogMode =
  | { type: "idle" }
  | { type: "create" }
  | { type: "edit"; note: ProductNoteDto }
  | { type: "delete"; note: ProductNoteDto };

interface ProductNotesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function NoteRowActions({
  note,
  onEdit,
  onDelete,
}: {
  note: ProductNoteDto;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`Actions for note ${note.title}`}
          onClick={(event) => event.stopPropagation()}
          onPointerDown={(event) => event.stopPropagation()}
        >
          <MoreVertical className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        onCloseAutoFocus={(event) => event.preventDefault()}
        onClick={(event) => event.stopPropagation()}
      >
        <DropdownMenuItem onSelect={onEdit}>Edit</DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onSelect={onDelete}>
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function NoteDescriptionPanel({ description }: { description: string }) {
  return (
    <div className="bg-background/60 py-3 dark:bg-background/40">
      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Description
      </p>
      {description ? (
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
          {description}
        </p>
      ) : (
        <p className="text-sm italic text-muted-foreground">No description</p>
      )}
    </div>
  );
}

export function ProductNotesDialog({
  open,
  onOpenChange,
}: ProductNotesDialogProps) {
  const { notes, isLoading, error, createNote, updateNote, deleteNote } =
    useProductNotes(open);
  const [search, setSearch] = useState("");
  const [productArea, setProductArea] = useState<ProductAreaFilter>("all");
  const [mode, setMode] = useState<DialogMode>({ type: "idle" });
  const [actionError, setActionError] = useState<string | null>(null);
  const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null);

  const filteredNotes = useMemo(
    () => filterProductNotes(notes, { search, productArea }),
    [notes, search, productArea]
  );

  const editingNote = mode.type === "edit" ? mode.note : null;
  const notePendingDelete = mode.type === "delete" ? mode.note : null;
  const formOpen = mode.type === "create" || mode.type === "edit";
  const deleteAlertOpen = mode.type === "delete";

  const handleSave = async (input: ProductNoteCreateInput) => {
    setActionError(null);
    if (mode.type === "edit") {
      await updateNote(mode.note.id, input);
    } else {
      await createNote(input);
    }
  };

  const handleConfirmDelete = async (id: string) => {
    setActionError(null);
    try {
      await deleteNote(id);
      setMode({ type: "idle" });
      if (expandedNoteId === id) {
        setExpandedNoteId(null);
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  const hasActiveFilters = search.trim() !== "" || productArea !== "all";
  const emptyMessage = hasActiveFilters
    ? "No notes match your filters."
    : "No notes yet.";

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Notes</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row">
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search notes…"
                aria-label="Search notes"
                className="sm:max-w-xs"
              />
              <Select
                value={productArea}
                onValueChange={(value) => {
                  if (isProductAreaFilter(value)) {
                    setProductArea(value);
                  }
                }}
              >
                <SelectTrigger
                  className="w-full sm:w-40"
                  aria-label="Filter by product area"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All areas</SelectItem>
                  {PRODUCT_AREAS.map((area) => (
                    <SelectItem key={area} value={area}>
                      {PRODUCT_AREA_LABELS[area]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => setMode({ type: "create" })}
              className="shrink-0 active:scale-[0.97] ease-out will-change-transform motion-reduce:transition-none motion-reduce:active:scale-100"
            >
              + Create note
            </Button>
          </div>

          {(error || actionError) && (
            <p className="text-sm text-destructive" role="alert">
              {actionError || error}
            </p>
          )}

          <div className="min-h-[20rem] overflow-hidden rounded-md border border-border/80 bg-muted/40 dark:border-border dark:bg-muted/30">
            <Table>
              <TableHeader>
                <TableRow className="border-border/70 bg-muted/50 hover:bg-muted/50 dark:border-border dark:bg-muted/40 dark:hover:bg-muted/40">
                  <TableHead className="pl-4 text-muted-foreground">
                    Title
                  </TableHead>
                  <TableHead className="text-muted-foreground">Area</TableHead>
                  <TableHead className="text-muted-foreground">Updated</TableHead>
                  <TableHead className="w-12">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody
                className={
                  !isLoading && filteredNotes.length > 0
                    ? "[&_tr:last-child]:!border-b"
                    : undefined
                }
              >
                {isLoading ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="h-[calc(20rem-2.5rem)] text-center align-middle text-muted-foreground"
                    >
                      Loading notes…
                    </TableCell>
                  </TableRow>
                ) : filteredNotes.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="h-[calc(20rem-2.5rem)] text-center align-middle text-muted-foreground"
                    >
                      {emptyMessage}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredNotes.map((note) => {
                    const isExpanded = expandedNoteId === note.id;

                    return (
                      <Fragment key={note.id}>
                        <TableRow
                          className={cn(
                            "border-border/60 transition-colors duration-150 ease-out hover:bg-muted/40 dark:border-border/80 dark:hover:bg-muted/35",
                            isExpanded &&
                              "border-b-transparent bg-primary/5 hover:bg-primary/5 dark:bg-primary/10 dark:hover:bg-primary/10"
                          )}
                          aria-expanded={isExpanded}
                        >
                          <TableCell
                            className="max-w-[18rem] cursor-pointer whitespace-normal py-3.5 pl-4 align-middle"
                            onClick={() =>
                              setExpandedNoteId((current) =>
                                current === note.id ? null : note.id
                              )
                            }
                          >
                            <div className="flex items-start gap-2">
                              <ChevronDown
                                aria-hidden="true"
                                className={cn(
                                  "mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform duration-150 ease-out motion-reduce:transition-none",
                                  isExpanded && "rotate-180"
                                )}
                              />
                              <p className="min-w-0 flex-1 text-sm font-medium leading-snug text-foreground">
                                {note.title}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="align-middle">
                            <Badge
                              variant="outline"
                              className="border-border/80 bg-background/60 dark:border-border dark:bg-background/40"
                            >
                              {PRODUCT_AREA_LABELS[note.productArea]}
                            </Badge>
                          </TableCell>
                          <TableCell className="whitespace-normal align-middle text-muted-foreground dark:text-muted-foreground/90">
                            {formatNoteUpdatedAt(note.updatedAt)}
                          </TableCell>
                          <TableCell className="text-right align-middle">
                            <NoteRowActions
                              note={note}
                              onEdit={() =>
                                setMode({ type: "edit", note })
                              }
                              onDelete={() =>
                                setMode({ type: "delete", note })
                              }
                            />
                          </TableCell>
                        </TableRow>
                        <TableRow
                          className={cn(
                            "border-border/60 hover:bg-transparent dark:border-border/80",
                            isExpanded
                              ? "bg-primary/5 dark:bg-primary/10"
                              : "border-0"
                          )}
                          data-state={isExpanded ? "open" : "closed"}
                        >
                          <TableCell colSpan={4} className="p-0">
                            <Collapsible open={isExpanded}>
                              <CollapsibleContent
                                className={NOTE_DESCRIPTION_COLLAPSIBLE}
                              >
                                <div
                                  className="cursor-pointer pb-3.5 pl-4 pr-4 pt-0"
                                  onClick={() =>
                                    setExpandedNoteId((current) =>
                                      current === note.id ? null : note.id
                                    )
                                  }
                                >
                                  <NoteDescriptionPanel
                                    description={note.description}
                                  />
                                </div>
                              </CollapsibleContent>
                            </Collapsible>
                          </TableCell>
                        </TableRow>
                      </Fragment>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      <ProductNoteEditorDialog
        open={formOpen}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setMode({ type: "idle" });
          }
        }}
        note={editingNote}
        onSave={handleSave}
      />

      <DeleteProductNoteAlert
        note={notePendingDelete}
        open={deleteAlertOpen}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setMode({ type: "idle" });
          }
        }}
        onConfirm={(id) => {
          void handleConfirmDelete(id);
        }}
      />
    </>
  );
}
