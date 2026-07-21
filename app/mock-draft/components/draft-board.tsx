import { Badge } from "@/components/ui/badge";
import { PLAYERS } from "@/lib/mock-draft/players";
import { getOverallPick } from "@/lib/mock-draft/snake";
import type { DraftState } from "@/lib/mock-draft/types";
import { TOTAL_ROUNDS } from "@/lib/mock-draft/types";
import { cn } from "@/lib/utils";
import { PlayerHeadshot } from "./player-headshot";

interface DraftBoardProps {
  state: DraftState;
}

export function DraftBoard({ state }: DraftBoardProps) {
  const playersById = new Map(PLAYERS.map((player) => [player.id, player]));
  const picksByOverall = new Map(
    state.picks.map((pick) => [pick.overall, pick]),
  );

  return (
    <div className="overflow-x-auto rounded-xl border bg-card">
      <table className="w-max min-w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 min-w-20 border-b bg-muted px-3 py-3 text-left">
              Round
            </th>
            {state.teams.map((team) => (
              <th
                key={team.slot}
                className={cn(
                  "min-w-40 border-b border-l bg-muted px-3 py-3 text-left",
                  team.isUser && "bg-primary/15 text-primary",
                )}
              >
                <span className="block text-xs text-muted-foreground">
                  Slot {team.slot}
                </span>
                {team.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: TOTAL_ROUNDS }, (_, index) => index + 1).map(
            (round) => (
              <tr key={round}>
                <th className="sticky left-0 z-10 border-b bg-card px-3 py-3 text-left">
                  {round}
                </th>
                {state.teams.map((team) => {
                  const overall = getOverallPick(
                    round,
                    team.slot,
                    state.config.teamCount,
                  );
                  const pick = picksByOverall.get(overall);
                  const player = pick
                    ? playersById.get(pick.playerId)
                    : undefined;

                  return (
                    <td
                      key={team.slot}
                      className={cn(
                        "h-16 border-b border-l px-3 py-2 align-top",
                        team.isUser && "bg-primary/5",
                      )}
                    >
                      {player ? (
                        <>
                          <div className="flex items-center gap-2">
                            <PlayerHeadshot player={player} size="sm" />
                            <p className="max-w-28 truncate font-medium">
                              {player.name}
                            </p>
                          </div>
                          <div className="mt-1 flex items-center gap-2">
                            <Badge variant="outline">{player.position}</Badge>
                            <span className="text-xs text-muted-foreground">
                              #{player.rank}
                            </span>
                          </div>
                        </>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ),
          )}
        </tbody>
      </table>
    </div>
  );
}
