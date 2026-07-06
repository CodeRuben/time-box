"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { CircleUser, Loader2, LogIn, Settings } from "lucide-react";
import { HeaderTimer } from "@/app/components/header-timer";
import { ThemeToggle } from "@/app/planner/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  key: string;
};

type NavigationResponse = {
  items?: NavItem[];
};

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
          <div className="pt-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              asChild
            >
              <Link href="/settings">
                <Settings className="size-4" aria-hidden />
                Settings
              </Link>
            </Button>
          </div>
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

const fallbackNavItems = [
  { href: "/", label: "Planner", key: "planner" },
  { href: "/tasks", label: "Tasks", key: "tasks" },
  { href: "/workout-tracker", label: "Workouts", key: "workouts" },
  { href: "/reading-journal", label: "Book log", key: "reading-journal" },
];

const VISIBLE_ROUTES = new Set([
  ...fallbackNavItems.map((item) => item.href),
  "/settings",
]);

function isHeaderVisible(pathname: string): boolean {
  if (VISIBLE_ROUTES.has(pathname)) {
    return true;
  }

  for (const href of VISIBLE_ROUTES) {
    if (href !== "/" && pathname.startsWith(`${href}/`)) {
      return true;
    }
  }

  return false;
}

function isNavItemActive(pathname: string, href: string): boolean {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavigationLoadingLinks() {
  return (
    <div className="flex items-center gap-2" aria-hidden>
      <span className="h-4 w-11 animate-pulse rounded bg-muted motion-reduce:animate-none" />
      <span className="h-4 w-8 animate-pulse rounded bg-muted motion-reduce:animate-none" />
      <span className="h-4 w-14 animate-pulse rounded bg-muted motion-reduce:animate-none" />
    </div>
  );
}

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
  const { status } = useSession();
  const [navItems, setNavItems] = useState<NavItem[] | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadNavigation() {
      try {
        const response = await fetch("/api/settings/navigation");
        const result = (await response.json()) as NavigationResponse;

        if (!response.ok) {
          throw new Error("Unable to load navigation");
        }

        if (!cancelled && response.ok) {
          setNavItems(result.items ?? []);
        }
      } catch {
        if (!cancelled) {
          setNavItems(fallbackNavItems);
        }
      }
    }

    void loadNavigation();

    return () => {
      cancelled = true;
    };
  }, [status]);

  if (!pathname || !isHeaderVisible(pathname)) {
    return null;
  }

  return (
    <header className="sticky top-0 z-40 bg-background/85 backdrop-blur">
      <div className="flex h-12 w-full items-center px-4 sm:px-6 lg:px-8">
        <Link href="/" className="mr-4 flex items-center">
          <LogoMarkA />
        </Link>

        <nav className="flex items-center gap-1" aria-label="Primary">
          {navItems === null ? (
            <NavigationLoadingLinks />
          ) : (
            navItems.map((item) => {
              const isActive = isNavItemActive(pathname, item.href);

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
            })
          )}
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
