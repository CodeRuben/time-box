"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { CircleUser, Loader2, LogIn } from "lucide-react";
import { HeaderTimer } from "@/app/components/header-timer";
import { ThemeToggle } from "@/app/planner/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

function AccountHeaderControl() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <Button
        variant="outline"
        size="icon"
        className="size-9"
        disabled
        aria-label="Loading session"
      >
        <Loader2 className="size-4 animate-spin" aria-hidden />
      </Button>
    );
  }

  if (status === "unauthenticated") {
    return (
      <Button variant="outline" size="icon" className="size-9" asChild>
        <Link href="/login" aria-label="Sign in">
          <LogIn className="size-4" aria-hidden />
        </Link>
      </Button>
    );
  }

  return (
    <Popover modal={false}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="size-9"
          aria-label="Account"
        >
          <CircleUser className="size-4" aria-hidden />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        side="bottom"
        sideOffset={6}
        className="w-64"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="space-y-1">
          <p className="text-sm font-semibold">
            {session?.user?.name?.trim() || "Signed in"}
          </p>
          {session?.user?.email ? (
            <p className="break-all text-xs text-muted-foreground">
              {session.user?.email}
            </p>
          ) : null}
          <p className="pt-1 text-xs text-muted-foreground">
            Planner and workouts are saved to your account.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3 w-full"
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            Sign out
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

const navItems = [
  { href: "/", label: "Planner" },
  { href: "/tasks", label: "Tasks" },
  { href: "/workout-tracker", label: "Workouts" },
];

const VISIBLE_ROUTES = new Set(navItems.map((item) => item.href));

function LogoMarkA() {
  return (
    <div className="grid size-5 grid-cols-2 grid-rows-2 gap-[3px]">
      <span className="rounded-[2px] bg-foreground" />
      <span className="rounded-[2px] bg-foreground/50" />
      <span className="rounded-[2px] bg-foreground/50" />
      <span className="rounded-[2px] bg-foreground/25" />
    </div>
  );
}

export function AppHeader() {
  const pathname = usePathname();

  if (!pathname || !VISIBLE_ROUTES.has(pathname)) {
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

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <HeaderTimer />
          <AccountHeaderControl />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
