export type Position = "QB" | "RB" | "WR" | "TE" | "K" | "DST";

export type PlayerKey = `espn:${string}` | `team:${string}`;

export type OffenseTier = "good" | "mid" | "bad";

export type PlayerSignal =
  | {
      kind: "injury-risk";
    }
  | {
      kind: "veteran-age";
      age: number;
      threshold: number;
    }
  | {
      kind: "rookie";
      classYear: number;
    }
  | {
      kind: "offense-tier";
      tier: Exclude<OffenseTier, "mid">;
      projectedPointsPerGame: number;
    }
  | {
      kind: "contingent-upside";
      dependencyKey: PlayerKey;
    };

export interface Player {
  id: number;
  key: PlayerKey;
  rank: number;
  name: string;
  position: Position;
  nflTeam: string;
  bye: number;
  headshot: string | null;
  signals: readonly PlayerSignal[];
}

export const POSITIONS: Position[] = ["QB", "RB", "WR", "TE", "K", "DST"];

export const STORAGE_KEY = "draft-rankings-2026-08-30";

export type DraftRankingsView = "board" | "compact";

export type DraftRankingsPersisted = {
  ids: number[];
  draftedIds: number[];
  draftMode: boolean;
  view: DraftRankingsView;
};
