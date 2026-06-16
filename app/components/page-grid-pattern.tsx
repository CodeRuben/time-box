import { cn } from "@/lib/utils";

type PageGridPatternProps = {
  className?: string;
  variant?: "default" | "primary";
};

export function PageGridPattern({
  className,
  variant = "default",
}: PageGridPatternProps) {
  if (variant === "primary") {
    return (
      <div
        className={cn("pointer-events-none absolute inset-0 opacity-40", className)}
        aria-hidden
      >
        <div className="absolute -left-16 top-12 h-56 w-56 rounded-full bg-primary-foreground/15 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-primary-foreground/10 blur-3xl" />
        <div className="page-grid-pattern page-grid-pattern--primary absolute inset-0" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden opacity-40 dark:opacity-34",
        className,
      )}
      aria-hidden
    >
      <div className="absolute -left-16 top-12 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-primary/8 blur-3xl" />
      <div className="page-grid-pattern absolute inset-0" />
    </div>
  );
}
