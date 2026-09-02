import type { Player } from "@/lib/draft-rankings/types";

import { DefenseScheduleBadge } from "./defense-schedule-badge";

interface DstScheduleBadgeForPlayerProps {
  player: Player;
  className?: string;
}

export function DstScheduleBadgeForPlayer({
  player,
  className,
}: DstScheduleBadgeForPlayerProps) {
  if (player.position !== "DST") {
    return null;
  }

  return (
    <DefenseScheduleBadge
      team={player.nflTeam}
      teamName={player.name}
      className={className}
    />
  );
}
