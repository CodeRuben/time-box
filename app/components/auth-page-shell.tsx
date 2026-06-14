import type { ReactNode } from "react";
import { AuthLogoHeader } from "@/app/components/auth-logo-header";
import { Card, CardContent } from "@/components/ui/card";

type AuthPageShellProps = {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthPageShell({
  title,
  description,
  children,
  footer,
}: AuthPageShellProps) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-6">
      <div className="w-full max-w-md">
        <Card className="gap-0 overflow-hidden border-border/80 bg-card/95 py-0 shadow-xl backdrop-blur-sm">
          <CardContent className="space-y-5 px-6 py-5">
            <AuthLogoHeader />

            <div className="space-y-2 text-center">
              <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
              {description ? (
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {description}
                </p>
              ) : null}
            </div>

            {children}

            {footer ? (
              <div className="text-center text-sm text-muted-foreground">
                {footer}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
