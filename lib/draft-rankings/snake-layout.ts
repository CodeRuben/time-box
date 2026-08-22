import type { Player } from "./types";

export const BOARD_COLUMNS = 12;

/** Split players into draft rounds, reversing even rounds for snake display. */
export function toSnakeRows(
  players: Player[],
  columns = BOARD_COLUMNS,
): (Player | null)[][] {
  const rows: (Player | null)[][] = [];

  for (let start = 0; start < players.length; start += columns) {
    const chunk = players.slice(start, start + columns);
    const cells: (Player | null)[] = Array.from(
      { length: columns },
      (_, index) => chunk[index] ?? null,
    );
    const roundIndex = Math.floor(start / columns);

    if (roundIndex % 2 === 1) {
      cells.reverse();
    }

    rows.push(cells);
  }

  return rows;
}
