import Link from "next/link";
import { cn } from "@/lib/utils";

const DOT_ROWS = 3;
const DOT_COLS = 14;

function dotStyle(row: number, col: number, side: "left" | "right") {
  const distanceFromLogo = side === "left" ? DOT_COLS - 1 - col : col;
  const fade = Math.max(0, 1 - distanceFromLogo / (DOT_COLS * 0.88));
  const twinkle = ((row * 5 + col * 7) % 5) / 5;
  const opacity = fade * (0.15 + twinkle * 0.75);
  const size = twinkle > 0.55 ? "size-1" : "size-0.5";

  return { opacity, size };
}

function DotPattern({ side }: { side: "left" | "right" }) {
  return (
    <div
      className={cn(
        "grid min-w-0 flex-1 shrink gap-x-1.5 gap-y-2 sm:gap-x-2",
        side === "left"
          ? "[mask-image:linear-gradient(to_left,black_30%,transparent_92%)]"
          : "[mask-image:linear-gradient(to_right,black_30%,transparent_92%)]",
      )}
      style={{
        gridTemplateColumns: `repeat(${DOT_COLS}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${DOT_ROWS}, minmax(0, 1fr))`,
      }}
      aria-hidden
    >
      {Array.from({ length: DOT_ROWS * DOT_COLS }, (_, index) => {
        const row = Math.floor(index / DOT_COLS);
        const col = index % DOT_COLS;
        const { opacity, size } = dotStyle(row, col, side);

        return (
          <span
            key={index}
            className={cn("justify-self-center rounded-full bg-foreground", size)}
            style={{ opacity }}
          />
        );
      })}
    </div>
  );
}

function LogoMark() {
  return (
    <div
      className="grid size-6 grid-cols-2 grid-rows-2 gap-[3px]"
      aria-hidden
    >
      <span className="rounded-[3px] bg-foreground" />
      <span className="rounded-[3px] bg-foreground/50" />
      <span className="rounded-[3px] bg-foreground/50" />
      <span className="rounded-[3px] bg-foreground/25" />
    </div>
  );
}

export function AuthLogoHeader() {
  return (
    <div className="flex w-full items-center justify-center gap-2 overflow-hidden sm:gap-3">
      <DotPattern side="left" />
      <Link
        href="/"
        className="flex size-11 shrink-0 items-center justify-center rounded-[14px] border border-border/70 bg-muted/30 shadow-sm transition-opacity hover:opacity-85"
        aria-label="Timeboxing Planner home"
      >
        <LogoMark />
      </Link>
      <DotPattern side="right" />
    </div>
  );
}
