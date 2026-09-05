"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Menu } from "lucide-react";
import { ThemeToggle } from "@/app/planner/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { PAGE_FEATURES } from "@/lib/features";
import {
  AccountHeaderControl,
  LogoMarkA,
  NavLinks,
  NavigationLoadingLinks,
  RAIL_TOOL_BUTTON_CLASS,
  isChromePath,
  isNavItem,
  type NavItem,
} from "@/app/components/app-nav-chrome";

type NavigationResponse = {
  items?: Array<{ href: string; label: string; key: string }>;
};

const fallbackNavItems: NavItem[] = PAGE_FEATURES.map((feature) => ({
  href: feature.href,
  label: feature.label,
  key: feature.key,
}));

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const { status } = useSession();
  const [navItems, setNavItems] = useState<NavItem[] | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMobileMenuOpen(false);
    // Next.js only resets window scroll; this pane stays mounted in the root layout.
    scrollRef.current?.scrollTo(0, 0);
  }, [pathname]);

  useEffect(() => {
    let cancelled = false;

    async function loadNavigation() {
      try {
        const response = await fetch("/api/settings/navigation");
        const result = (await response.json()) as NavigationResponse;

        if (!response.ok) {
          throw new Error("Unable to load navigation");
        }

        if (!cancelled) {
          setNavItems((result.items ?? []).filter(isNavItem));
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

  if (!pathname || !isChromePath(pathname)) {
    return <div className="min-h-dvh bg-background">{children}</div>;
  }

  const mobileHeader =
    navItems === null ? (
      <NavigationLoadingLinks compact />
    ) : (
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="size-9"
            aria-label="Open menu"
          >
            <Menu className="size-4" aria-hidden />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="h-full w-full max-w-none border-0">
          <SheetHeader className="flex-row items-center gap-2 space-y-0">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center"
            >
              <LogoMarkA />
            </Link>
            <SheetTitle>Menu</SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col gap-1 px-2" aria-label="Primary">
            <NavLinks
              items={navItems}
              pathname={pathname}
              appearance="sheet"
              onNavigate={() => setMobileMenuOpen(false)}
            />
          </nav>
        </SheetContent>
      </Sheet>
    );

  return (
    <div className="flex h-dvh overflow-hidden bg-background md:bg-muted">
      <aside className="hidden h-full w-[4.75rem] shrink-0 flex-col text-muted-foreground md:flex">
        <div className="flex shrink-0 items-center justify-center px-1 pt-3 pb-5">
          <Link href="/" aria-label="Timebox" className="text-current">
            <LogoMarkA />
          </Link>
        </div>
        {navItems === null ? (
          <NavigationLoadingLinks />
        ) : (
          <nav
            className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-1.5 pt-2 pb-1"
            aria-label="Primary"
          >
            <NavLinks items={navItems} pathname={pathname} appearance="rail" />
          </nav>
        )}
        <div className="mt-auto flex shrink-0 flex-col items-center gap-1 border-t border-border/60 p-1.5">
          <AccountHeaderControl
            variant="ghost"
            className={RAIL_TOOL_BUTTON_CLASS}
            popoverSide="right"
            popoverAlign="start"
          />
          <ThemeToggle variant="ghost" className={RAIL_TOOL_BUTTON_CLASS} />
        </div>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col md:py-3 md:pr-0 md:pl-0">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col md:overflow-hidden md:rounded-l-2xl md:border md:border-r-0 md:border-border md:bg-background md:shadow-sm">
          <header className="sticky top-0 z-40 flex h-12 shrink-0 items-center gap-2 bg-background/85 px-4 backdrop-blur md:hidden">
            {mobileHeader}
            <div className="ml-auto flex items-center gap-1 sm:gap-2">
              <AccountHeaderControl />
              <ThemeToggle />
            </div>
          </header>
          <div
            ref={scrollRef}
            className="min-h-0 flex-1 overflow-y-auto scrollbar-themed"
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
