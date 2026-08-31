import { repairDraftedIds } from "./drafted";
import { PLAYERS } from "./players";
import {
  STORAGE_KEY,
  type DraftRankingsPersisted,
  type DraftRankingsView,
} from "./types";

export function getDefaultPlayerIds(): number[] {
  return PLAYERS.map((player) => player.id);
}

export function getDefaultDraftRankingsState(): DraftRankingsPersisted {
  return {
    ids: getDefaultPlayerIds(),
    draftedIds: [],
    draftMode: false,
    view: "board",
  };
}

function isValidIdList(value: unknown): value is number[] {
  return (
    Array.isArray(value) &&
    value.every((id) => typeof id === "number" && Number.isInteger(id))
  );
}

function knownPlayerIds(): Set<number> {
  return new Set(PLAYERS.map((player) => player.id));
}

function isDraftRankingsView(value: unknown): value is DraftRankingsView {
  return value === "board" || value === "compact";
}

/** Merge saved order with the current player pool, dropping unknowns and appending missing ids. */
export function repairPlayerIds(ids: number[]): number[] {
  const knownIds = knownPlayerIds();
  const seen = new Set<number>();
  const repaired: number[] = [];

  for (const id of ids) {
    if (!knownIds.has(id) || seen.has(id)) {
      continue;
    }
    seen.add(id);
    repaired.push(id);
  }

  for (const player of PLAYERS) {
    if (!seen.has(player.id)) {
      repaired.push(player.id);
    }
  }

  return repaired;
}

export function parseDraftRankingsState(
  parsed: unknown
): DraftRankingsPersisted | null {
  if (isValidIdList(parsed)) {
    return {
      ids: repairPlayerIds(parsed),
      draftedIds: [],
      draftMode: false,
      view: "board",
    };
  }

  if (parsed === null || typeof parsed !== "object") {
    return null;
  }

  const record = parsed as Record<string, unknown>;
  if (!isValidIdList(record.ids)) {
    return null;
  }

  return {
    ids: repairPlayerIds(record.ids),
    draftedIds: isValidIdList(record.draftedIds)
      ? repairDraftedIds(record.draftedIds, knownPlayerIds())
      : [],
    draftMode: record.draftMode === true,
    view: isDraftRankingsView(record.view) ? record.view : "board",
  };
}

export function loadDraftRankingsState(): DraftRankingsPersisted {
  if (typeof window === "undefined") {
    return getDefaultDraftRankingsState();
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === null) {
      return getDefaultDraftRankingsState();
    }

    const state = parseDraftRankingsState(JSON.parse(raw));
    if (state === null) {
      window.localStorage.removeItem(STORAGE_KEY);
      return getDefaultDraftRankingsState();
    }

    return state;
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return getDefaultDraftRankingsState();
  }
}

export function saveDraftRankingsState(state: DraftRankingsPersisted): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn("Failed to save draft rankings:", error);
  }
}

export function clearDraftRankingsState(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
}
