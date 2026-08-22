"use client";

import Image from "next/image";
import { useState } from "react";

import type { Player } from "@/lib/draft-rankings/types";
import { cn } from "@/lib/utils";

const SIZES = {
  sm: { display: 28, className: "size-7 text-[9px]" },
  md: { display: 40, className: "size-10 text-[10px]" },
  lg: { display: 56, className: "size-14 text-xs" },
} as const;

interface PlayerHeadshotProps {
  player: Player;
  size?: keyof typeof SIZES;
  className?: string;
}

function getFallbackLabel(player: Player): string {
  if (player.position === "DST") {
    return player.nflTeam;
  }

  return player.name
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function PlayerHeadshot({
  player,
  size = "lg",
  className,
}: PlayerHeadshotProps) {
  const dimensions = SIZES[size];
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const showImage =
    player.headshot !== null && failedSrc !== player.headshot;

  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-black/20 font-semibold text-white/90 ring-2 ring-white/30",
        dimensions.className,
        className,
      )}
    >
      {showImage && player.headshot ? (
        <Image
          src={player.headshot}
          alt=""
          fill
          sizes={`${dimensions.display * 3}px`}
          className="object-cover"
          onError={() => setFailedSrc(player.headshot)}
        />
      ) : (
        <span aria-hidden>{getFallbackLabel(player)}</span>
      )}
    </div>
  );
}
