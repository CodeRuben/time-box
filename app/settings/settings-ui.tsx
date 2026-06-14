"use client";

import { useEffect, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { Check, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function SettingsPageIntro({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {title}
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          {description}
        </p>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function SettingsAlert({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "rounded-xl border border-destructive/25 bg-destructive/8 px-4 py-3 text-sm text-destructive",
        className
      )}
    >
      {children}
    </div>
  );
}

export function SettingsPanel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm",
        className
      )}
    >
      {children}
    </section>
  );
}

export function SettingsPanelHeader({
  icon: Icon,
  title,
  description,
  badge,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  badge?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border/60 px-5 py-5 sm:px-6">
      <div className="flex items-start gap-3.5">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground">
          <Icon className="size-[18px]" aria-hidden />
        </div>
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold text-foreground">{title}</h2>
            {badge ? (
              <Badge variant="secondary" className="font-normal">
                {badge}
              </Badge>
            ) : null}
          </div>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        </div>
      </div>
      {action}
    </div>
  );
}

export type SettingsSaveState = {
  isLoading: boolean;
  isSaving: boolean;
};

const MIN_SAVING_DISPLAY_MS = 800;

export function SettingsSaveStatus({ isSaving }: { isSaving: boolean }) {
  const [showSaving, setShowSaving] = useState(false);
  const savingStartedAtRef = useRef<number | null>(null);

  useEffect(() => {
    if (isSaving) {
      savingStartedAtRef.current = Date.now();
      setShowSaving(true);
      return;
    }

    if (savingStartedAtRef.current === null) {
      return;
    }

    const elapsed = Date.now() - savingStartedAtRef.current;
    const delay = Math.max(0, MIN_SAVING_DISPLAY_MS - elapsed);

    const timeout = window.setTimeout(() => {
      setShowSaving(false);
      savingStartedAtRef.current = null;
    }, delay);

    return () => window.clearTimeout(timeout);
  }, [isSaving]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center gap-2 rounded-full border border-border/70 bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground transition-opacity duration-300"
    >
      {showSaving ? (
        <>
          <Loader2 className="size-3.5 animate-spin" aria-hidden />
          Saving...
        </>
      ) : (
        <>
          <Check className="size-3.5" aria-hidden />
          All changes saved
        </>
      )}
    </div>
  );
}

export function SettingsList({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("divide-y divide-border/60", className)}>{children}</div>
  );
}

export function SettingsGroupLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "bg-muted/25 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground sm:px-6",
        className
      )}
    >
      {children}
    </div>
  );
}

export function SettingsRow({
  title,
  description,
  meta,
  children,
  className,
}: {
  title: string;
  description?: string;
  meta?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6",
        className
      )}
    >
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium text-foreground">{title}</p>
          {meta}
        </div>
        {description ? (
          <p className="text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-2">{children}</div>
    </div>
  );
}

export function SettingsSwitch({
  checked,
  disabled,
  label,
  size = "default",
  onCheckedChange,
}: {
  checked: boolean;
  disabled?: boolean;
  label: string;
  size?: "default" | "md" | "sm";
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative inline-flex shrink-0 items-center rounded-full border border-transparent transition-colors duration-200",
        "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        "disabled:pointer-events-none disabled:cursor-not-allowed",
        size === "default" && "h-5 w-9",
        size === "md" && "h-[18px] w-[34px]",
        size === "sm" && "h-4 w-7",
        checked
          ? "bg-primary hover:bg-primary/90 dark:bg-primary/85 dark:hover:bg-primary/75"
          : "bg-muted-foreground/20 hover:bg-muted-foreground/28 dark:bg-muted-foreground/25 dark:hover:bg-muted-foreground/35"
      )}
    >
      <span
        className={cn(
          "pointer-events-none inline-block rounded-full bg-card shadow-[0_1px_2px_rgba(0,0,0,0.12)] ring-1 ring-black/5 transition-transform duration-200 dark:bg-white dark:ring-white/15",
          size === "default" && "size-3.5",
          size === "md" && "size-3",
          size === "sm" && "size-2.5",
          size === "default" && (checked ? "translate-x-[18px]" : "translate-x-0.5"),
          size === "md" && (checked ? "translate-x-[16px]" : "translate-x-0.5"),
          size === "sm" && (checked ? "translate-x-[14px]" : "translate-x-0.5")
        )}
      />
    </button>
  );
}

export function SettingsMiniSwitch({
  checked,
  disabled,
  label,
  onCheckedChange,
}: {
  checked: boolean;
  disabled?: boolean;
  label: string;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <SettingsSwitch
        checked={checked}
        disabled={disabled}
        label={label}
        size="md"
        onCheckedChange={onCheckedChange}
      />
      <span className="text-[9px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

export function SettingsStatusBadge({
  label,
  tone = "neutral",
  compact = false,
}: {
  label: string;
  tone?: "neutral" | "success" | "warning" | "muted";
  compact?: boolean;
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "inline-flex items-center justify-center text-center font-normal leading-none",
        compact
          ? "h-5 min-w-0 px-2 py-0 text-[10px] uppercase tracking-wide"
          : "min-w-[4.25rem] px-2.5 py-0.5 text-xs",
        tone === "success" && "border-primary/25 bg-primary/8 text-primary",
        tone === "warning" && "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300",
        tone === "muted" && "text-muted-foreground"
      )}
    >
      {label}
    </Badge>
  );
}

export function SettingsLoadingState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center px-6 py-14 text-sm text-muted-foreground">
      <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
      {message}
    </div>
  );
}
