import { Input } from "@/components/ui/input";

interface TopPrioritiesProps {
  priorities: string[];
  onPriorityChange: (index: number, value: string) => void;
}

export function TopPriorities({
  priorities,
  onPriorityChange,
}: TopPrioritiesProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold text-foreground">Top Priorities</h2>
      <div className="space-y-3">
        <Input
          type="text"
          placeholder="Priority 1"
          value={priorities[0]}
          onChange={(e) => onPriorityChange(0, e.target.value)}
          className="w-full"
        />
        <Input
          type="text"
          placeholder="Priority 2"
          value={priorities[1]}
          onChange={(e) => onPriorityChange(1, e.target.value)}
          className="w-full"
        />
        <Input
          type="text"
          placeholder="Priority 3"
          value={priorities[2]}
          onChange={(e) => onPriorityChange(2, e.target.value)}
          className="w-full"
        />
      </div>
    </div>
  );
}

