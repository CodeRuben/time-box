import type { LucideIcon } from "lucide-react";
import { AlertCircle, BadgeCheck, Check, Loader2 } from "lucide-react";
import type { AutosaveStatus } from "@/lib/autosave-status";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type AutosaveIndicatorProps = {
  status: AutosaveStatus;
  className?: string;
};

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
    Icon: BadgeCheck,
    label: "Up to date",
    iconClassName: "text-muted-foreground",
    textClassName: "text-muted-foreground",
  },
  saving: {
    Icon: Loader2,
    label: "Saving…",
    iconClassName: "text-primary animate-spin",
    textClassName: "text-primary",
  },
  saved: {
    Icon: Check,
    label: "Saved",
    iconClassName: "text-emerald-600 dark:text-emerald-400",
    textClassName: "text-emerald-600 dark:text-emerald-400",
    buttonClassName:
      "border-emerald-600/30 dark:border-emerald-400/30 bg-emerald-600/5 dark:bg-emerald-400/5",
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
