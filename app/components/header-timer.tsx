"use client";

import { Pause, Play, RotateCcw, Timer } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useTwoMinuteCountdown } from "@/app/components/hooks/use-two-minute-countdown";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PANEL_EASING = "ease-[cubic-bezier(0.645,0.045,0.355,1)]";

export function HeaderTimer() {
  const [expanded, setExpanded] = useState(false);
  const { secondsLeft, isRunning, play, pause, reset, display } =
    useTwoMinuteCountdown();

  const toggle = useCallback(() => {
    setExpanded((wasOpen) => {
      if (wasOpen) reset();
      return !wasOpen;
    });
  }, [reset]);

  useEffect(() => {
    if (!expanded) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        reset();
        setExpanded(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [expanded, reset]);

  const done = secondsLeft === 0 && !isRunning;

  return (
    <div
      className={cn(
        "flex h-9 shrink-0 items-center overflow-hidden rounded-md border bg-card shadow-xs transition-colors",
        "hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50"
      )}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-9 rounded-none"
        aria-label={expanded ? "Close 2 minute timer" : "Open 2 minute timer"}
        aria-expanded={expanded}
        onClick={toggle}
      >
        <Timer className="size-4" aria-hidden />
      </Button>

      <div
        className={cn(
          "grid overflow-hidden transition-[grid-template-columns] will-change-[grid-template-columns] motion-reduce:transition-none motion-reduce:will-change-auto",
          PANEL_EASING,
          expanded
            ? "grid-cols-[minmax(0,1fr)] duration-300"
            : "grid-cols-[minmax(0,0fr)] duration-250"
        )}
      >
        <div className="min-w-0">
          <div
            className={cn(
              "flex h-9 w-max max-w-[min(100vw-6rem,20rem)] items-center gap-2 pr-2",
              expanded ? "pointer-events-auto pl-1" : "pointer-events-none pl-0"
            )}
          >
            <p
              className="min-w-17 font-mono text-base tabular-nums leading-none tracking-tight"
              aria-live="polite"
              aria-label={done ? `Time is up. ${display}` : undefined}
            >
              {display}
            </p>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="active:scale-[0.97] ease-out will-change-transform motion-reduce:transition-none motion-reduce:active:scale-100"
              onClick={isRunning ? pause : play}
              aria-label={
                isRunning
                  ? "Pause timer"
                  : secondsLeft === 0
                    ? "Start 2 minute timer"
                    : "Resume timer"
              }
            >
              {isRunning ? (
                <Pause className="size-4" aria-hidden />
              ) : (
                <Play className="size-4" aria-hidden />
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={!isRunning && secondsLeft === 120}
              onClick={reset}
              aria-label="Reset timer"
            >
              <RotateCcw className="size-4" aria-hidden />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
