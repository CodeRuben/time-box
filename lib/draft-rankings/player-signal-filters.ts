import type {
  Player,
  PlayerSignal,
  PlayerSignalFilterId,
  Position,
} from "./types";

export function getSignalFilterId(signal: PlayerSignal): PlayerSignalFilterId {
  switch (signal.kind) {
    case "injury-risk":
    case "veteran-age":
    case "rookie":
    case "contingent-upside":
      return signal.kind;
    case "offense-tier":
      return signal.tier === "good" ? "offense-good" : "offense-bad";
    default: {
      const exhaustiveSignal: never = signal;
      return exhaustiveSignal;
    }
  }
}

export function playerMatchesSignalFilters(
  player: Pick<Player, "signals">,
  activeSignalFilters: ReadonlySet<PlayerSignalFilterId>,
): boolean {
  if (activeSignalFilters.size === 0) {
    return true;
  }

  return player.signals.some((signal) =>
    activeSignalFilters.has(getSignalFilterId(signal)),
  );
}

export function isPlayerDimmed(
  player: Pick<Player, "position" | "signals">,
  activePositions: ReadonlySet<Position>,
  activeSignalFilters: ReadonlySet<PlayerSignalFilterId>,
): boolean {
  if (activePositions.size > 0 && !activePositions.has(player.position)) {
    return true;
  }

  return !playerMatchesSignalFilters(player, activeSignalFilters);
}
