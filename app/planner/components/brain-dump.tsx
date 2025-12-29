import { Textarea } from "@/components/ui/textarea";

interface BrainDumpProps {
  value: string;
  onChange: (value: string) => void;
}

export function BrainDump({ value, onChange }: BrainDumpProps) {
  return (
    <div className="flex flex-col gap-4 flex-1 min-h-0">
      <h2 className="text-2xl font-semibold text-foreground">Brain Dump</h2>
      <Textarea
        placeholder="Write down all your thoughts, tasks, and ideas here..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full flex-1 resize-none"
      />
    </div>
  );
}

