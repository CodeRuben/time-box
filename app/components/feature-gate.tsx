"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoadingScreen } from "@/components/ui/loading-screen";
import type { FeatureKey } from "@/lib/features";

type AccessResponse = {
  allowed?: boolean;
  isAuthenticated?: boolean;
  error?: string;
};

type NavItem = {
  href: string;
};

type NavigationResponse = {
  items?: NavItem[];
  error?: string;
};

type FeatureGateProps = {
  featureKey: FeatureKey;
  children: ReactNode;
};

export function FeatureGate({ featureKey, children }: FeatureGateProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAllowed, setIsAllowed] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function checkAccess() {
      setIsLoading(true);
      setIsAllowed(false);
      setError("");

      try {
        const response = await fetch(
          `/api/settings/access?feature=${encodeURIComponent(featureKey)}`
        );
        const result = (await response.json()) as AccessResponse;

        if (!response.ok) {
          throw new Error(result.error ?? "Unable to check feature access");
        }

        if (cancelled) {
          return;
        }

        setIsAuthenticated(result.isAuthenticated === true);

        if (result.allowed === true) {
          setIsAllowed(true);
          setIsLoading(false);
          return;
        }

        const navigationResponse = await fetch("/api/settings/navigation");
        const navigation = (await navigationResponse.json()) as NavigationResponse;

        if (!navigationResponse.ok) {
          throw new Error(navigation.error ?? "Unable to find an available page");
        }

        if (cancelled) {
          return;
        }

        const destination = navigation.items?.find(
          (item) => item.href !== pathname
        );

        if (destination) {
          router.replace(destination.href);
          return;
        }

        setIsLoading(false);
      } catch (accessError) {
        if (!cancelled) {
          setError(
            accessError instanceof Error
              ? accessError.message
              : "Unable to check feature access"
          );
          setIsLoading(false);
        }
      }
    }

    void checkAccess();

    return () => {
      cancelled = true;
    };
  }, [featureKey, pathname, router]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAllowed) {
    return (
      <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="mx-auto max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>No pages available</CardTitle>
              <CardDescription>
                No feature pages are currently enabled for your account.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error ? (
                <p className="text-sm text-destructive">{error}</p>
              ) : null}
              <div className="flex flex-wrap gap-2">
                {isAuthenticated ? (
                  <Button asChild>
                    <Link href="/settings">Open settings</Link>
                  </Button>
                ) : (
                  <Button asChild>
                    <Link href="/login">Sign in</Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return children;
}
