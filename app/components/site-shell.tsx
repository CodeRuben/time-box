import type { ReactNode } from "react";
import { PageGridPattern } from "@/app/components/page-grid-pattern";

type SiteShellProps = {
  children: ReactNode;
};

export function SiteShell({ children }: SiteShellProps) {
  return (
    <div className="relative min-h-screen bg-background">
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden>
        <PageGridPattern />
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  );
}
