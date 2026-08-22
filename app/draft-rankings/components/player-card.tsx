"use client";

import type { CSSProperties, HTMLAttributes, KeyboardEvent } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { POSITION_CARD_CLASS } from "@/lib/draft-rankings/position-styles";
import type { Player } from "@/lib/draft-rankings/types";
import { cn } from "@/lib/utils";

import { PlayerHeadshot } from "./player-headshot";

interface PlayerCardProps {
  player: Player;
  dimmed: boolean;
  taken: boolean;
  draftMode: boolean;
  onToggleTaken: (playerId: number) => void;
}

interface SortablePlayerCardProps extends PlayerCardProps {
  prefersReducedMotion?: boolean;
}

function PlayerCardContent({
  player,
  dimmed,
  taken,
  draftMode,
  onToggleTaken,
  style,
  dragProps,
  isDragging,
  setNodeRef,
}: PlayerCardProps & {
  style?: CSSProperties;
  dragProps?: HTMLAttributes<HTMLDivElement>;
  isDragging?: boolean;
  setNodeRef?: (node: HTMLElement | null) => void;
}) {
  function handleActivate() {
    if (draftMode) {
      onToggleTaken(player.id);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!draftMode) {
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onToggleTaken(player.id);
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...dragProps}
      role={draftMode ? "button" : undefined}
      tabIndex={draftMode ? 0 : undefined}
      aria-pressed={draftMode ? taken : undefined}
      aria-label={
        draftMode
          ? taken
            ? `Mark ${player.name} available`
            : `Mark ${player.name} taken`
          : undefined
      }
      onClick={handleActivate}
      onKeyDown={handleKeyDown}
      className={cn(
        "flex flex-col items-center gap-1.5 rounded-md border p-2 text-center shadow-xs transition-opacity",
        draftMode ? "cursor-pointer" : "cursor-grab active:cursor-grabbing",
        POSITION_CARD_CLASS[player.position],
        dimmed && !taken && "opacity-25",
        taken && "opacity-35 grayscale",
        isDragging && "z-10 opacity-95 shadow-md ring-2 ring-white/80",
      )}
    >
      <div className="flex w-full items-center justify-between gap-1">
        <span className="text-[11px] font-bold tabular-nums text-white/90">
          {player.rank}
        </span>
        <span className="text-[10px] font-semibold tracking-wide text-white/80">
          {player.position}
        </span>
      </div>

      <PlayerHeadshot player={player} size="lg" />

      <div className="min-w-0 w-full">
        <p
          className={cn(
            "truncate text-xs leading-tight font-semibold",
            taken && "line-through"
          )}
        >
          {player.name}
        </p>
        <p className="mt-0.5 truncate text-[10px] text-white/80">
          {taken ? "Taken" : `${player.nflTeam} · Bye ${player.bye}`}
        </p>
      </div>
    </div>
  );
}

export function SortablePlayerCard({
  player,
  dimmed,
  taken,
  draftMode,
  prefersReducedMotion = false,
  onToggleTaken,
}: SortablePlayerCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: player.id, disabled: draftMode });

  return (
    <PlayerCardContent
      player={player}
      dimmed={dimmed}
      taken={taken}
      draftMode={draftMode}
      onToggleTaken={onToggleTaken}
      isDragging={isDragging}
      setNodeRef={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition: prefersReducedMotion ? undefined : transition,
      }}
      dragProps={draftMode ? undefined : { ...attributes, ...listeners }}
    />
  );
}
