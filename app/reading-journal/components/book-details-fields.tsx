import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BookCoverImage } from "./book-cover-image";
import { CoverPicker } from "./cover-picker";

export interface BookDetailsFormValue {
  title: string;
  author: string;
  totalPages: string;
  publishedYear: string;
  coverUrl: string;
}

export const EMPTY_BOOK_DETAILS_FORM: BookDetailsFormValue = {
  title: "",
  author: "",
  totalPages: "",
  publishedYear: "",
  coverUrl: "",
};

interface BookDetailsFieldsProps {
  value: BookDetailsFormValue;
  onChange: (value: BookDetailsFormValue) => void;
  idPrefix: string;
  /** Present when the book came from Open Library — enables the cover picker. */
  openLibraryKey?: string;
}

export function BookDetailsFields({
  value,
  onChange,
  idPrefix,
  openLibraryKey,
}: BookDetailsFieldsProps) {
  const setField = <K extends keyof BookDetailsFormValue>(
    key: K,
    fieldValue: string
  ) => {
    onChange({ ...value, [key]: fieldValue });
  };

  return (
    <div className="space-y-4">
      {value.coverUrl && (
        <div className="flex justify-center">
          <div className="relative h-32 w-22 overflow-hidden rounded-sm border bg-muted">
            <BookCoverImage
              src={value.coverUrl}
              alt="Cover preview"
              sizes="88px"
            />
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-title`}>Title</Label>
        <Input
          id={`${idPrefix}-title`}
          value={value.title}
          onChange={(event) => setField("title", event.target.value)}
          placeholder="Book title"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-author`}>Author</Label>
        <Input
          id={`${idPrefix}-author`}
          value={value.author}
          onChange={(event) => setField("author", event.target.value)}
          placeholder="Author"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-total-pages`}>Total pages</Label>
          <Input
            id={`${idPrefix}-total-pages`}
            type="number"
            min={1}
            value={value.totalPages}
            onChange={(event) => setField("totalPages", event.target.value)}
            placeholder="e.g. 412"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-published-year`}>Published year</Label>
          <Input
            id={`${idPrefix}-published-year`}
            type="number"
            value={value.publishedYear}
            onChange={(event) => setField("publishedYear", event.target.value)}
            placeholder="e.g. 1965"
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor={`${idPrefix}-cover-url`}>Cover URL</Label>
          {openLibraryKey && (
            <CoverPicker
              openLibraryKey={openLibraryKey}
              currentCoverUrl={value.coverUrl}
              onSelect={(coverUrl) => setField("coverUrl", coverUrl)}
            />
          )}
        </div>
        <Input
          id={`${idPrefix}-cover-url`}
          value={value.coverUrl}
          onChange={(event) => setField("coverUrl", event.target.value)}
          placeholder="https://…"
        />
      </div>
    </div>
  );
}
