import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { formatDateKey } from "@/lib/date-key";

interface DateSelectorProps {
  value: Date | undefined;
  onChange: (value: Date | undefined) => void;
}

export function DateSelector({ value, onChange }: DateSelectorProps) {
  const handleSelect = (nextDate: Date | undefined) => {
    if (!nextDate) {
      return;
    }

    if (value && formatDateKey(value) === formatDateKey(nextDate)) {
      return;
    }

    onChange(nextDate);
  };

  return (
    <div className="flex items-center gap-2">
      <Label htmlFor="date" className="text-lg font-semibold whitespace-nowrap">
        Date:
      </Label>
      <DatePicker
        date={value}
        onSelect={handleSelect}
        className="w-auto sm:w-56"
      />
    </div>
  );
}
