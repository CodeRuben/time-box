"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { applyBrainDumpTransforms } from "@/lib/brain-dump-transforms";
import { Check, ListPlus, Smile, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const SYMBOLS = ["✔️", "❌", "⏳", "🐛", "⚠️", "✨"];
const SUCCESS_FEEDBACK_MS = 1250;

function useBriefSuccessFeedback(durationMs = SUCCESS_FEEDBACK_MS) {
  const [active, setActive] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const trigger = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setActive(true);
    timeoutRef.current = setTimeout(() => {
      setActive(false);
      timeoutRef.current = null;
    }, durationMs);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { active, trigger };
}

function IconCrossfade({
  IdleIcon,
  active,
}: {
  IdleIcon: LucideIcon;
  active: boolean;
}) {
  return (
    <span className="relative flex h-4 w-4 items-center justify-center">
      <IdleIcon
        className={cn(
          "absolute h-4 w-4 transition-[opacity,scale] duration-150 ease-out-cubic will-change-[opacity,scale] motion-reduce:transition-none",
          active ? "scale-90 opacity-0" : "scale-100 opacity-100"
        )}
      />
      <Check
        className={cn(
          "absolute h-4 w-4 transition-[opacity,scale] duration-150 ease-out-cubic will-change-[opacity,scale] motion-reduce:transition-none",
          active ? "scale-100 opacity-100" : "scale-90 opacity-0"
        )}
      />
    </span>
  );
}

interface WorkingNotesProps {
  value: string;
  onChange: (value: string) => void;
  canSyncToFocus: boolean;
  onSyncToFocus: () => void;
}

export function WorkingNotes({
  value,
  onChange,
  canSyncToFocus,
  onSyncToFocus,
}: WorkingNotesProps) {
  const emojiFeedback = useBriefSuccessFeedback();
  const syncFeedback = useBriefSuccessFeedback();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pendingCursorRef = useRef<number | null>(null);

  const copySymbolToClipboard = async (symbol: string) => {
    if (!navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(symbol);
      emojiFeedback.trigger();
    } catch {
      // Keep this silent so failed clipboard permission checks do not interrupt typing.
    }
  };

  const handleSyncToFocus = () => {
    if (!canSyncToFocus || syncFeedback.active) {
      return;
    }

    onSyncToFocus();
    syncFeedback.trigger();
  };

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const cursor = event.target.selectionStart ?? event.target.value.length;
    const next = applyBrainDumpTransforms(event.target.value, cursor);
    if (next.cursor !== cursor || next.text !== event.target.value) {
      pendingCursorRef.current = next.cursor;
    }
    onChange(next.text);
  };

  useLayoutEffect(() => {
    const cursor = pendingCursorRef.current;
    const textarea = textareaRef.current;
    if (cursor === null || !textarea) {
      return;
    }
    textarea.setSelectionRange(cursor, cursor);
    pendingCursorRef.current = null;
  }, [value]);

  return (
    <div className="flex flex-col gap-4 flex-1 min-h-0">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xl sm:text-2xl font-semibold text-foreground">
          Working Notes
        </h2>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-9 w-9"
            aria-label={
              syncFeedback.active
                ? "Working notes synced to focus list"
                : "Sync working notes to focus list"
            }
            disabled={!canSyncToFocus || syncFeedback.active}
            onClick={handleSyncToFocus}
          >
            <IconCrossfade IdleIcon={ListPlus} active={syncFeedback.active} />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-9 w-9"
                aria-label={
                  emojiFeedback.active ? "Emoji copied" : "Open emoji picker"
                }
              >
                <IconCrossfade IdleIcon={Smile} active={emojiFeedback.active} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="grid grid-cols-3 gap-1 p-2 min-w-0 w-fit"
            >
              {SYMBOLS.map((symbol) => (
                <DropdownMenuItem
                  key={symbol}
                  onClick={() => void copySymbolToClipboard(symbol)}
                  className="h-9 w-9 justify-center p-0 text-base"
                >
                  {symbol}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <Textarea
        ref={textareaRef}
        placeholder="Write down all your thoughts, tasks, and ideas here..."
        value={value}
        onChange={handleChange}
        className="scrollbar-themed w-full flex-1 resize-none min-h-[300px] md:min-h-[400px] lg:min-h-[500px] max-h-[min(60vh,28rem)] md:max-h-[min(65vh,32rem)] lg:max-h-[min(70vh,36rem)] overflow-y-auto bg-card dark:bg-card"
      />
    </div>
  );
}
