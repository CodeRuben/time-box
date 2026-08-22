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

export const POSITIONS: Position[] = ["QB", "RB", "WR", "TE", "K", "DST"];

export const STORAGE_KEY = "draft-rankings-2026-08-22";

export type DraftRankingsPersisted = {
  ids: number[];
  draftedIds: number[];
  draftMode: boolean;
};
