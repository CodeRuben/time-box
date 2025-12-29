"use client";

import { ThemeProvider } from "../planner/components/theme-provider";

export function ThemeProviderWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ThemeProvider>{children}</ThemeProvider>;
}

