import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";

interface DateSelectorProps {
  value: Date | undefined;
  onChange: (value: Date | undefined) => void;
}

export function DateSelector({ value, onChange }: DateSelectorProps) {
  return (
    <div className="flex items-center gap-4">
      <Label
        htmlFor="date"
        className="text-lg font-semibold whitespace-nowrap"
      >
        Date:
      </Label>
      <DatePicker
        date={value}
        onSelect={onChange}
        className="w-full max-w-xs"
      />
    </div>
  );
}

