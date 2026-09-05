import { DEFAULT_LEAGUE_SIZE, type LeagueSize, type Player } from "./types";

export const BOARD_COLUMN_MIN_WIDTH_PX = 100;

/** Split players into Board rounds of League Size. The last round may be short. */
export function chunkRounds(
  players: Player[],
  leagueSize: LeagueSize = DEFAULT_LEAGUE_SIZE,
): Player[][] {
  const rounds: Player[][] = [];

  for (let start = 0; start < players.length; start += leagueSize) {
    rounds.push(players.slice(start, start + leagueSize));
  }

  return rounds;
}

/** Pad each round to League Size and reverse even rounds for snake display. */
export function toSnakeRows(
  players: Player[],
  leagueSize: LeagueSize = DEFAULT_LEAGUE_SIZE,
): (Player | null)[][] {
  return chunkRounds(players, leagueSize).map((chunk, roundIndex) => {
    const cells: (Player | null)[] = Array.from(
      { length: leagueSize },
      (_, index) => chunk[index] ?? null,
    );

    if (roundIndex % 2 === 1) {
      cells.reverse();
    }

    return cells;
  });
}
