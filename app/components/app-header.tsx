"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/app/planner/components/theme-toggle";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Planner" },
  { href: "/workout-tracker", label: "Workouts" },
];

export function LogoMarkA() {
  return (
    <div className="grid h-5 w-5 grid-cols-2 grid-rows-2 gap-[3px]">
      <span className="rounded-[2px] bg-foreground" />
      <span className="rounded-[2px] bg-foreground/50" />
      <span className="rounded-[2px] bg-foreground/50" />
      <span className="rounded-[2px] bg-foreground/25" />
    </div>
  );
}

export function LogoMarkB() {
  return (
    <div className="flex h-5 w-5 items-center justify-center gap-0.5">
      <span className="h-4 w-[3px] rounded-full bg-foreground/80" />
      <span className="h-4 w-[3px] rounded-full bg-foreground/50" />
      <span className="h-4 w-[3px] rounded-full bg-foreground/30" />
    </div>
  );
}

export function AppHeader() {
  const pathname = usePathname();

  if (!pathname || (pathname !== "/" && pathname !== "/workout-tracker")) {
    return null;
  }

  return (
    <header className="sticky top-0 z-40 bg-background/85 backdrop-blur">
      <div className="flex h-12 w-full items-center px-4 sm:px-6 lg:px-8">
        <Link href="/" className="mr-4 flex items-center">
          <LogoMarkA />
        </Link>

        <nav className="flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium transition-colors",
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
