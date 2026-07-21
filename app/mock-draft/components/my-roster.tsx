import { AlertTriangle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { assignLineup } from "@/lib/mock-draft/roster";
import type { Player } from "@/lib/mock-draft/types";
import { PlayerHeadshot } from "./player-headshot";

const STARTER_KEYS = [
  "QB",
  "RB1",
  "RB2",
  "WR1",
  "WR2",
  "TE",
  "FLEX",
  "K",
  "DST",
] as const;

interface MyRosterProps {
  roster: Player[];
  title?: string;
  embedded?: boolean;
}

function PlayerRow({
  label,
  player,
  hasByeConflict = false,
}: {
  label: string;
  player: Player | null;
  hasByeConflict?: boolean;
}) {
  return (
    <div className="grid grid-cols-[3rem_minmax(0,1fr)_auto] items-center gap-2 rounded-md px-2 py-2 odd:bg-muted/40">
      <span className="text-xs font-semibold text-muted-foreground">
        {label}
      </span>
      {player ? (
        <>
          <div className="flex min-w-0 items-center gap-2">
            <PlayerHeadshot player={player} size="sm" />
            <span className="truncate text-sm font-medium">{player.name}</span>
          </div>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            Bye {player.bye}
            {hasByeConflict ? (
              <AlertTriangle
                className="size-3.5 text-amber-600 dark:text-amber-400"
                aria-label={`Starter bye conflict in week ${player.bye}`}
              >
                <title>Multiple starters share this bye week</title>
              </AlertTriangle>
            ) : null}
          </span>
        </>
      ) : (
        <span className="col-span-2 text-sm text-muted-foreground">Empty</span>
      )}
    </div>
  );
}

function RosterContent({ roster }: { roster: Player[] }) {
  const lineup = assignLineup(roster);
  const starterPlayers = Object.values(lineup.starters).filter(
    (player): player is Player => player !== null,
  );
  const byeCounts = new Map<number, number>();
  for (const player of starterPlayers) {
    byeCounts.set(player.bye, (byeCounts.get(player.bye) ?? 0) + 1);
  }

  return (
    <div className="space-y-5">
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Starters</h3>
          <Badge variant="secondary">{starterPlayers.length}/9</Badge>
        </div>
        <div>
          {STARTER_KEYS.map((key) => {
            const player = lineup.starters[key];
            return (
              <PlayerRow
                key={key}
                label={key}
                player={player}
                hasByeConflict={
                  player ? (byeCounts.get(player.bye) ?? 0) > 1 : false
                }
              />
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold">Bench</h3>
        <div>
          {Array.from({ length: 5 }, (_, index) => (
            <PlayerRow
              key={index}
              label={`B${index + 1}`}
              player={lineup.bench[index] ?? null}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function MyRoster({
  roster,
  title = "My Roster",
  embedded = false,
}: MyRosterProps) {
  if (embedded) {
    return <RosterContent roster={roster} />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <RosterContent roster={roster} />
      </CardContent>
    </Card>
  );
}
