"use client";

import type { ReactNode } from "react";

interface FocusBoardEmptyStateProps {
  children: ReactNode;
}

export function FocusBoardEmptyState({ children }: FocusBoardEmptyStateProps) {
  return (
    <section
      aria-label="Focus list empty"
      className="flex min-h-0 flex-1 flex-col gap-2.5"
    >
      <div className="flex items-center gap-2 border-b border-border/60 pb-2.5">
        <h3 className="text-sm font-semibold text-foreground">To do</h3>
        <span className="rounded-full bg-muted/80 px-2 py-0.5 text-[11px] font-medium tabular-nums text-muted-foreground">
          0
        </span>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-4 py-10 sm:py-14">
        <div className="max-w-[15rem] space-y-1.5 text-center">
          <p className="text-[15px] font-medium tracking-tight text-foreground/90">
            Start your focus list
          </p>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Pull from your brain dump or priorities.
          </p>
        </div>
        {children}
      </div>
    </section>
  );
}
