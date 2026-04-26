"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { Check, Smile } from "lucide-react";
import { cn } from "@/lib/utils";

const SYMBOLS = ["✔️", "❌", "⏳", "✅", "⚠️", "✨"];

interface BrainDumpProps {
  value: string;
  onChange: (value: string) => void;
}

export function BrainDump({ value, onChange }: BrainDumpProps) {
  const [showCheckIcon, setShowCheckIcon] = useState(false);
  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showCopyFeedback = () => {
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
    }
    setShowCheckIcon(true);
    feedbackTimeoutRef.current = setTimeout(() => {
      setShowCheckIcon(false);
      feedbackTimeoutRef.current = null;
    }, 1250);
  };

  const copySymbolToClipboard = async (symbol: string) => {
    if (!navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(symbol);
      showCopyFeedback();
    } catch {
      // Keep this silent so failed clipboard permission checks do not interrupt typing.
    }
  };

  useEffect(() => {
    return () => {
      if (feedbackTimeoutRef.current) {
        clearTimeout(feedbackTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="flex flex-col gap-4 flex-1 min-h-0">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xl sm:text-2xl font-semibold text-foreground">Brain Dump</h2>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-9 w-9"
                aria-label={
                  showCheckIcon ? "Emoji copied" : "Open emoji picker"
                }
              >
                <span className="relative flex h-4 w-4 items-center justify-center">
                  <Smile
                    className={cn(
                      "absolute h-4 w-4 transition-[opacity,scale] duration-150 ease-out-cubic will-change-[opacity,scale] motion-reduce:transition-none",
                      showCheckIcon ? "scale-90 opacity-0" : "scale-100 opacity-100"
                    )}
                  />
                  <Check
                    className={cn(
                      "absolute h-4 w-4 transition-[opacity,scale] duration-150 ease-out-cubic will-change-[opacity,scale] motion-reduce:transition-none",
                      showCheckIcon ? "scale-100 opacity-100" : "scale-90 opacity-0"
                    )}
                  />
                </span>
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
        placeholder="Write down all your thoughts, tasks, and ideas here..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="scrollbar-themed w-full flex-1 resize-none min-h-[300px] md:min-h-[400px] lg:min-h-[500px] max-h-[min(60vh,28rem)] md:max-h-[min(65vh,32rem)] lg:max-h-[min(70vh,36rem)] overflow-y-auto"
      />
    </div>
  );
}
