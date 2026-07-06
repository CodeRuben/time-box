import { Textarea } from "@/components/ui/textarea";

interface BookNotesProps {
  notes: string;
  onChange: (notes: string) => void;
  isSaving: boolean;
  isSaved: boolean;
}

export function BookNotes({ notes, onChange, isSaving, isSaved }: BookNotesProps) {
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="journal-heading text-sm">Notes</h2>
        {(isSaving || isSaved) && (
          <span className="text-xs text-muted-foreground">
            {isSaving ? "Saving…" : "Saved"}
          </span>
        )}
      </div>
      <Textarea
        value={notes}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Jot down anything about this book…"
        className="min-h-32"
      />
    </section>
  );
}
