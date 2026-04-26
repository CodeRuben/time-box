"use client";

import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "./theme-provider";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      className="h-9 w-9 active:scale-[0.97] transition-transform ease-out will-change-transform motion-reduce:transition-none motion-reduce:active:scale-100"
      aria-label="Toggle theme"
    >
      <span className="relative flex h-5 w-5 items-center justify-center">
        <Moon
          className={cn(
            "absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 transition-[opacity,filter,scale] duration-100 ease-out will-change-[opacity,filter,scale] motion-reduce:transition-none motion-reduce:blur-none",
            theme === "light"
              ? "scale-100 opacity-100 blur-none"
              : "scale-0 opacity-0 blur-[2px]"
          )}
        />
        <Sun
          className={cn(
            "absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 transition-[opacity,filter,scale] duration-100 ease-out will-change-[opacity,filter,scale] motion-reduce:transition-none motion-reduce:blur-none",
            theme === "dark"
              ? "scale-100 opacity-100 blur-none"
              : "scale-0 opacity-0 blur-[2px]"
          )}
        />
      </span>
    </Button>
  );
}
