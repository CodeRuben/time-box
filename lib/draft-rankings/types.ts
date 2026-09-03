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

export const PLAYER_SIGNAL_FILTER_IDS = [
  "injury-risk",
  "veteran-age",
  "rookie",
  "offense-good",
  "offense-bad",
  "contingent-upside",
] as const;

export type PlayerSignalFilterId = (typeof PLAYER_SIGNAL_FILTER_IDS)[number];

export const NFL_TEAMS = [
  "ARI",
  "ATL",
  "BAL",
  "BUF",
  "CAR",
  "CHI",
  "CIN",
  "CLE",
  "DAL",
  "DEN",
  "DET",
  "GB",
  "HOU",
  "IND",
  "JAX",
  "KC",
  "LAC",
  "LAR",
  "LV",
  "MIA",
  "MIN",
  "NE",
  "NO",
  "NYG",
  "NYJ",
  "PHI",
  "PIT",
  "SEA",
  "SF",
  "TB",
  "TEN",
  "WAS",
] as const;

export type NflTeam = (typeof NFL_TEAMS)[number];

export interface Player {
  id: number;
  key: PlayerKey;
  rank: number;
  name: string;
  position: Position;
  nflTeam: NflTeam;
  bye: number;
  headshot: string | null;
  signals: readonly PlayerSignal[];
}

export const POSITIONS: Position[] = ["QB", "RB", "WR", "TE", "K", "DST"];

export const STORAGE_KEY = "draft-rankings-2026-09-02";

export type DraftRankingsView = "board" | "compact";

export type DraftRankingsPersisted = {
  ids: number[];
  draftedIds: number[];
  draftMode: boolean;
  view: DraftRankingsView;
};
