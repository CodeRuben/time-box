"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { Smile } from "lucide-react";

const SYMBOLS = ["✔️", "❌", "☑️", "✅", "⚠️", "✨"];

interface BrainDumpProps {
  value: string;
  onChange: (value: string) => void;
}

export function BrainDump({ value, onChange }: BrainDumpProps) {
  const [copiedSymbol, setCopiedSymbol] = useState<string | null>(null);
  const copiedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showCopyFeedback = (symbol: string) => {
    if (copiedTimeoutRef.current) {
      clearTimeout(copiedTimeoutRef.current);
    }
    setCopiedSymbol(symbol);
    copiedTimeoutRef.current = setTimeout(() => {
      setCopiedSymbol(null);
      copiedTimeoutRef.current = null;
    }, 1400);
  };

  const copySymbolToClipboard = async (symbol: string) => {
    if (!navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(symbol);
      showCopyFeedback(symbol);
    } catch {
      // Keep this silent so failed clipboard permission checks do not interrupt typing.
    }
  };

  return (
    <div className="flex flex-col gap-4 flex-1 min-h-0">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-2xl font-semibold text-foreground">Brain Dump</h2>
        <div className="relative flex items-center gap-2">
          <div
            aria-live="polite"
            className={`pointer-events-none absolute -top-8 right-0 rounded-md border bg-muted px-2 py-0.5 text-xs text-muted-foreground shadow-sm transition-all duration-200 ${
              copiedSymbol ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"
            }`}
          >
            Copied!
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8"
                aria-label="Open emoji picker"
              >
                <Smile className="h-4 w-4" />
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
        className="w-full flex-1 resize-none min-h-[300px] md:min-h-[400px] lg:min-h-[500px]"
      />
    </div>
  );
}
