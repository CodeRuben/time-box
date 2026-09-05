"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import {
  BicepsFlexed,
  BookOpen,
  CalendarClock,
  CircleUser,
  ListOrdered,
  Loader2,
  LogIn,
  Settings,
  type LucideIcon,
} from "lucide-react";
import type { ComponentProps } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { PAGE_FEATURES, type PageFeatureKey } from "@/lib/features";
import { cn } from "@/lib/utils";

export type NavItem = {
  href: string;
  label: string;
  key: PageFeatureKey;
};

const NAV_ICONS = {
  planner: CalendarClock,
  workouts: BicepsFlexed,
  "reading-journal": BookOpen,
  "draft-rankings": ListOrdered,
} satisfies Record<PageFeatureKey, LucideIcon>;

const NAV_APPEARANCE = {
  rail: {
    base: "flex flex-col items-center gap-1 rounded-md px-1 py-2 text-center text-[11px] font-medium leading-tight transition-colors duration-150 ease-out",
    active:
      "bg-background text-foreground shadow-sm dark:bg-sky-500/30 dark:text-sky-200",
    idle: "hover:bg-background/80 hover:text-foreground dark:hover:bg-sky-500/15 dark:hover:text-sky-200",
    largeIcon: true,
  },
  sheet: {
    base: "flex items-center gap-3 rounded-md px-3 py-2.5 text-base font-medium transition-colors duration-150 ease-out",
    active: "bg-accent text-foreground",
    idle: "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
    largeIcon: false,
  },
} as const;

export const RAIL_TOOL_BUTTON_CLASS =
  "text-muted-foreground hover:bg-background/80 hover:text-foreground";

const CHROME_HREFS = [...PAGE_FEATURES.map((feature) => feature.href), "/settings"];

export function isNavItemActive(pathname: string, href: string): boolean {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function isChromePath(pathname: string): boolean {
  return CHROME_HREFS.some((href) => isNavItemActive(pathname, href));
}

export function isNavItem(item: {
  href: string;
  label: string;
  key: string;
}): item is NavItem {
  return Object.hasOwn(NAV_ICONS, item.key);
}

type AccountIconButtonProps = ComponentProps<typeof Button>;

function AccountIconButton({
  className,
  variant = "outline",
  ...props
}: AccountIconButtonProps) {
  return (
    <Button
      variant={variant}
      size="icon"
      className={cn("size-9", className)}
      {...props}
    />
  );
}

type AccountControlProps = {
  className?: string;
  variant?: "outline" | "ghost";
  popoverSide?: ComponentProps<typeof PopoverContent>["side"];
  popoverAlign?: ComponentProps<typeof PopoverContent>["align"];
};

export function AccountHeaderControl({
  className,
  variant = "outline",
  popoverSide = "bottom",
  popoverAlign = "end",
}: AccountControlProps) {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <AccountIconButton
        variant={variant}
        className={className}
        disabled
        aria-label="Loading session"
      >
        <Loader2 className="size-4 animate-spin" aria-hidden />
      </AccountIconButton>
    );
  }

  if (status === "unauthenticated") {
    return (
      <AccountIconButton variant={variant} className={className} asChild>
        <Link href="/login" aria-label="Sign in">
          <LogIn className="size-4" aria-hidden />
        </Link>
      </AccountIconButton>
    );
  }

  const displayName = session?.user?.name?.trim() || "Signed in";

  return (
    <Popover modal={false}>
      <PopoverTrigger asChild>
        <AccountIconButton
          variant={variant}
          className={className}
          aria-label="Account"
        >
          <CircleUser className="size-4" aria-hidden />
        </AccountIconButton>
      </PopoverTrigger>
      <PopoverContent
        align={popoverAlign}
        side={popoverSide}
        sideOffset={6}
        className="w-64"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="space-y-1">
          <p className="text-sm font-semibold">{displayName}</p>
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

export function NavItemIcon({
  featureKey,
  large = false,
}: {
  featureKey: PageFeatureKey;
  large?: boolean;
}) {
  const Icon = NAV_ICONS[featureKey];
  return (
    <Icon className={cn("shrink-0", large ? "size-5" : "size-4")} aria-hidden />
  );
}

export function NavLinks({
  items,
  pathname,
  appearance,
  onNavigate,
}: {
  items: NavItem[];
  pathname: string;
  appearance: keyof typeof NAV_APPEARANCE;
  onNavigate?: () => void;
}) {
  const styles = NAV_APPEARANCE[appearance];

  return items.map((item) => {
    const isActive = isNavItemActive(pathname, item.href);

    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={onNavigate}
        aria-current={isActive ? "page" : undefined}
        className={cn(styles.base, isActive ? styles.active : styles.idle)}
      >
        <NavItemIcon featureKey={item.key} large={styles.largeIcon} />
        {item.label}
      </Link>
    );
  });
}

export function NavigationLoadingLinks({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <span
        className="size-9 animate-pulse rounded-md bg-muted motion-reduce:animate-none"
        aria-hidden
      />
    );
  }

  return (
    <div className="flex flex-col items-center gap-2 px-1.5" aria-hidden>
      <span className="h-12 w-12 animate-pulse rounded-md bg-muted motion-reduce:animate-none" />
      <span className="h-12 w-12 animate-pulse rounded-md bg-muted motion-reduce:animate-none" />
      <span className="h-12 w-12 animate-pulse rounded-md bg-muted motion-reduce:animate-none" />
    </div>
  );
}

export function LogoMarkA() {
  return (
    <div className="grid size-5 grid-cols-2 grid-rows-2 gap-[3px]">
      <span className="rounded-[2px] bg-current" />
      <span className="rounded-[2px] bg-current/50" />
      <span className="rounded-[2px] bg-current/50" />
      <span className="rounded-[2px] bg-current/25" />
    </div>
  );
}
