import { playerMatchesSignalFilters } from "./player-signal-filters";
import type { NflTeam, Player, PlayerSignalFilterId, Position } from "./types";

export type HighlightFilters = {
  positions: ReadonlySet<Position>;
  signals: ReadonlySet<PlayerSignalFilterId>;
  teams: ReadonlySet<NflTeam>;
};

export function emptyHighlightFilters(): HighlightFilters {
  return {
    positions: new Set(),
    signals: new Set(),
    teams: new Set(),
  };
}

export function toggleSetMember<T>(current: ReadonlySet<T>, value: T): Set<T> {
  const next = new Set(current);
  if (next.has(value)) {
    next.delete(value);
  } else {
    next.add(value);
  }
  return next;
}

function setAllows<T>(selected: ReadonlySet<T>, value: T): boolean {
  return selected.size === 0 || selected.has(value);
}

export function isPlayerDimmed(
  player: Pick<Player, "position" | "signals" | "nflTeam">,
  filters: HighlightFilters,
): boolean {
  return !(
    setAllows(filters.positions, player.position) &&
    setAllows(filters.teams, player.nflTeam) &&
    playerMatchesSignalFilters(player, filters.signals)
  );
}

export function hasActiveHighlightFilters(filters: HighlightFilters): boolean {
  return (
    filters.positions.size > 0 ||
    filters.signals.size > 0 ||
    filters.teams.size > 0
  );
}
