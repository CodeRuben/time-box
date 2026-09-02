"use client";

import { Check, Circle, GripVertical } from "lucide-react";
import type {
  CSSProperties,
  HTMLAttributes,
  KeyboardEvent,
} from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { POSITION_COMPACT_CARD_CLASS } from "@/lib/draft-rankings/position-styles";
import type { Player } from "@/lib/draft-rankings/types";
import { cn } from "@/lib/utils";

import { DstScheduleBadgeForPlayer } from "./dst-schedule-badge-for-player";
import { PlayerSignalBadges } from "./player-signal-badges";

interface CompactPlayerRowProps {
  player: Player;
  dimmed: boolean;
  taken: boolean;
  draftMode: boolean;
  prefersReducedMotion: boolean;
  onToggleTaken: (playerId: number) => void;
}

export function CompactPlayerRow({
  player,
  dimmed,
  taken,
  draftMode,
  prefersReducedMotion,
  onToggleTaken,
}: CompactPlayerRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: player.id, disabled: draftMode });
  const dragProps: HTMLAttributes<HTMLDivElement> | undefined = draftMode
    ? undefined
    : { ...attributes, ...listeners };

  function handleActivate() {
    if (draftMode) {
      onToggleTaken(player.id);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onToggleTaken(player.id);
    }
  }

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: prefersReducedMotion ? undefined : transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex min-h-11 items-center gap-2 rounded-md border px-2.5 py-1.5 shadow-xs transition-[opacity,background-color,color,border-color]",
        POSITION_COMPACT_CARD_CLASS[player.position],
        dimmed && !taken && "opacity-25",
        taken &&
          "border-border bg-muted text-muted-foreground opacity-100 grayscale",
        isDragging && "z-10 opacity-95 shadow-md ring-2 ring-ring",
      )}
    >
      <div
        {...dragProps}
        role={draftMode ? "button" : dragProps?.role}
        tabIndex={draftMode ? 0 : dragProps?.tabIndex}
        aria-pressed={draftMode ? taken : undefined}
        aria-label={
          draftMode
            ? taken
              ? `Mark ${player.name} available`
              : `Mark ${player.name} taken`
            : undefined
        }
        onClick={handleActivate}
        onKeyDown={draftMode ? handleKeyDown : dragProps?.onKeyDown}
        className={cn(
          "flex min-w-0 flex-1 items-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          draftMode ? "cursor-pointer" : "cursor-grab active:cursor-grabbing",
        )}
      >
        {draftMode ? (
          taken ? (
            <Check className="size-4 shrink-0" aria-hidden />
          ) : (
            <Circle className="size-4 shrink-0 opacity-70" aria-hidden />
          )
        ) : (
          <GripVertical className="size-4 shrink-0 opacity-70" aria-hidden />
        )}

        <span className="w-7 shrink-0 text-right text-xs font-bold tabular-nums">
          {player.rank}
        </span>

        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "truncate text-sm font-semibold leading-tight",
              taken && "line-through",
            )}
          >
            {player.name}
          </p>
          <p className="truncate text-[11px] leading-tight opacity-80">
            {player.nflTeam} · Bye {player.bye}
          </p>
        </div>
      </div>

      <PlayerSignalBadges
        signals={player.signals}
        className="max-w-28 justify-end"
      />
      <DstScheduleBadgeForPlayer player={player} />

      <span className="shrink-0 rounded bg-black/15 px-1.5 py-0.5 text-[11px] font-bold">
        {player.position}
      </span>

      {draftMode ? (
        <span className="w-14 shrink-0 text-right text-[11px] font-semibold">
          {taken ? "Taken" : "Available"}
        </span>
      ) : null}
    </div>
  );
}
