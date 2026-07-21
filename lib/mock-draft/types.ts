export type Position = "QB" | "RB" | "WR" | "TE" | "K" | "DST";

export interface Player {
  id: number;
  rank: number;
  name: string;
  position: Position;
  nflTeam: string;
  bye: number;
  headshot: string | null;
}

export type ArchetypeId =
  | "balanced"
  | "rbHeavy"
  | "wrHeavy"
  | "zeroRb"
  | "earlyQb"
  | "lateQb"
  | "tePremium";

export interface DraftConfig {
  teamCount: 8 | 10 | 12;
  timerSeconds: 30 | 60 | 90 | 120;
  userSlot: number;
}

export interface DraftTeam {
  slot: number;
  name: string;
  isUser: boolean;
  archetype: ArchetypeId | null;
}

export interface DraftPick {
  overall: number;
  round: number;
  slot: number;
  playerId: number;
}

export type DraftStatus = "active" | "paused" | "complete";

export interface DraftState {
  version: 1;
  seed: number;
  config: DraftConfig;
  teams: DraftTeam[];
  picks: DraftPick[];
  status: DraftStatus;
  startedAt: string;
}

export const TOTAL_ROUNDS = 14;
export const STARTER_SLOTS = {
  QB: 1,
  RB: 2,
  WR: 2,
  TE: 1,
  FLEX: 1,
  K: 1,
  DST: 1,
} as const;
export const BENCH_SIZE = 5;
export const POSITION_CAPS: Record<Position, number> = {
  QB: 2,
  RB: 6,
  WR: 7,
  TE: 2,
  K: 1,
  DST: 1,
};
export const KICKER_DST_EARLIEST_ROUND = 13;

export const TEAM_COUNT_OPTIONS = [8, 10, 12] as const;
export const TIMER_OPTIONS = [30, 60, 90, 120] as const;
export const STORAGE_KEY = "mock-draft";

export const BOT_NAMES = [
  "Kino",
  "Jack Torrence",
  "Jason Dessen",
  "Colin",
  "Odysseus",
  "Clive Linley",
  "Kolya Vlasov",
  "Todd Bowden",
  "Leonard Marnham",
  "Stuart Ullman",
  "Gordie LaChance",
  "Lev Beniov",
] as const;
