import type { LucideIcon } from "lucide-react";
import { AlertCircle, Check, Cloud, Loader2 } from "lucide-react";
import type { AutosaveStatus } from "@/lib/autosave-status";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type AutosaveIndicatorProps = {
  status: AutosaveStatus;
  className?: string;
};

const muted = "text-muted-foreground";

const statusPresentation: Record<
  AutosaveStatus,
  {
    Icon: LucideIcon;
    label: string;
    iconClassName: string;
    textClassName: string;
    buttonClassName?: string;
  }
> = {
  idle: {
    Icon: Cloud,
    label: "All changes saved",
    iconClassName: muted,
    textClassName: muted,
  },
  saving: {
    Icon: Loader2,
    label: "Saving…",
    iconClassName: cn(muted, "animate-spin"),
    textClassName: muted,
  },
  saved: {
    Icon: Check,
    label: "Saved",
    iconClassName: muted,
    textClassName: muted,
  },
  error: {
    Icon: AlertCircle,
    label: "Save failed",
    iconClassName: "text-destructive",
    textClassName: "text-destructive",
    buttonClassName: "border-destructive/40",
  },
};

export function AutosaveIndicator({ status, className }: AutosaveIndicatorProps) {
  const { Icon, label, iconClassName, textClassName, buttonClassName } =
    statusPresentation[status];

  return (
    <div
      className={cn("inline-flex max-w-full min-w-0 items-center", className)}
      role="status"
      aria-live="polite"
    >
      <Button
        type="button"
        variant="outline"
        tabIndex={-1}
        className={cn(
          "h-9 min-w-0 max-w-full gap-1.5 px-2.5 py-0 pointer-events-none cursor-default [&_svg]:size-4",
          buttonClassName
        )}
      >
        <Icon className={cn("shrink-0", iconClassName)} aria-hidden />
        <span
          className={cn(
            "min-w-0 truncate text-left text-xs font-medium leading-none",
            textClassName
          )}
        >
          {label}
        </span>
      </Button>
    </div>
  );
}
