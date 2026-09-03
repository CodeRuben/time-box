import type { OffenseTier, PlayerKey, Position } from "./types";

export const SEASON_OPENING_DATE = "2026-09-09";
export const ROOKIE_CLASS_YEAR = 2026;

export const VETERAN_AGE_THRESHOLDS: Readonly<
  Partial<Record<Position, number>>
> = {
  QB: 35,
  RB: 28,
  WR: 30,
  TE: 31,
};

export const VETERAN_BIRTH_DATES_BY_PLAYER_KEY: Readonly<
  Partial<Record<PlayerKey, string>>
> = {
  "espn:12483": "1988-02-07",
  "espn:3117251": "1996-06-07",
  "espn:3929630": "1997-02-09",
  "espn:3043078": "1994-01-04",
  "espn:3054850": "1995-07-25",
  "espn:3042519": "1994-12-02",
  "espn:3916148": "1997-04-30",
  "espn:4035538": "1997-06-07",
  "espn:4569173": "1998-02-23",
  "espn:4038815": "1998-06-14",
  "espn:4047365": "1998-02-11",
  "espn:16800": "1992-12-24",
  "espn:16737": "1993-08-21",
  "espn:15818": "1992-04-27",
  "espn:2976212": "1993-11-29",
  "espn:3126486": "1996-01-15",
  "espn:3925357": "1994-12-20",
  "espn:3121422": "1995-09-15",
  "espn:3128429": "1995-10-10",
  "espn:3116165": "1996-02-27",
  "espn:15847": "1989-10-05",
  "espn:3040151": "1993-10-09",
  "espn:3116365": "1995-09-06",
  "espn:3121023": "1995-01-03",
  "espn:3046439": "1994-12-07",
  "espn:8439": "1983-12-02",
  "espn:15864": "1990-10-10",
  "espn:4040761": "1997-09-03",
  "espn:4241457": "1998-03-09",
};

export const INJURY_RISK_PLAYER_KEYS: ReadonlySet<PlayerKey> = new Set([
  "espn:3139477",
  "espn:3915511",
  "espn:3916387",
  "espn:4426348",
  "espn:3917792",
  "espn:3117251",
  "espn:4429160",
  "espn:4685382",
  "espn:4596448",
  "espn:4696981",
  "espn:4678008",
  "espn:4241985",
  "espn:4426385",
  "espn:4047646",
  "espn:4426502",
  "espn:4595348",
  "espn:3116165",
  "espn:4366031",
  "espn:4880281",
  "espn:4432665",
  "espn:3040151",
  "espn:4572680",
  "espn:4430027",
  "espn:4243389",
  "espn:3123076",
]);

export const ROOKIE_PLAYER_KEYS: ReadonlySet<PlayerKey> = new Set([
  "espn:4870808",
  "espn:4685512",
  "espn:4871023",
  "espn:4870795",
  "espn:4870653",
  "espn:4710714",
  "espn:4880281",
  "espn:4686658",
  "espn:4832800",
  "espn:4702555",
  "espn:4723820",
  "espn:4870847",
  "espn:5083315",
  "espn:4869645",
  "espn:4832955",
  "espn:4685555",
  "espn:4685246",
  "espn:5081432",
  "espn:4912218",
  "espn:4870612",
  "espn:4832846",
  "espn:4837248",
  "espn:4685261",
  "espn:4431574",
  "espn:4682648",
  "espn:5220680",
  "espn:4696044",
  "espn:4869961",
  "espn:5088338",
]);

export const TEAM_OFFENSE_PROJECTED_POINTS_PER_GAME: Readonly<
  Record<string, number>
> = {
  LAR: 26.2794117647059,
  DET: 26.1397058823529,
  BUF: 25.8970588235294,
  CIN: 25.8014705882353,
  BAL: 25.6691176470588,
  DAL: 25.6176470588235,
  SF: 25.1764705882353,
  GB: 24.8235294117647,
  SEA: 24.6838235294118,
  CHI: 24.4632352941176,
  KC: 24.2132352941176,
  PHI: 23.7279411764706,
  LAC: 23.625,
  NE: 23.5808823529412,
  WAS: 23.2941176470588,
  JAX: 23.1838235294118,
  IND: 23.0808823529412,
  TB: 23.0735294117647,
  HOU: 22.3235294117647,
  MIN: 22.2794117647059,
  DEN: 22.1911764705882,
  NYG: 21.8823529411765,
  NO: 21.4485294117647,
  ATL: 21.3014705882353,
  PIT: 21.1617647058824,
  TEN: 20.3823529411765,
  CAR: 20.2205882352941,
  LV: 19.0294117647059,
  MIA: 18.8235294117647,
  ARI: 18.4926470588235,
  NYJ: 18.3014705882353,
  CLE: 18.3014705882353,
};

const GOOD_OFFENSE_MAX_RANK = 10;
const MID_OFFENSE_MAX_RANK = 22;

export interface TeamOffenseProjection {
  projectedPointsPerGame: number;
  rank: number;
  tier: OffenseTier;
}

function deriveTeamOffenseProjections(
  pointsByTeam: Readonly<Record<string, number>>,
): Readonly<Record<string, TeamOffenseProjection>> {
  const ranked = Object.entries(pointsByTeam).sort(
    (left, right) => right[1] - left[1] || left[0].localeCompare(right[0]),
  );

  return Object.fromEntries(
    ranked.map(([team, projectedPointsPerGame], index) => {
      const rank = index + 1;
      const tier: OffenseTier =
        rank <= GOOD_OFFENSE_MAX_RANK
          ? "good"
          : rank <= MID_OFFENSE_MAX_RANK
            ? "mid"
            : "bad";

      return [team, { projectedPointsPerGame, rank, tier }];
    }),
  );
}

export const TEAM_OFFENSE_PROJECTIONS = deriveTeamOffenseProjections(
  TEAM_OFFENSE_PROJECTED_POINTS_PER_GAME,
);

export const CONTINGENT_UPSIDE_DEPENDENCY_BY_PLAYER_KEY: Readonly<
  Partial<Record<PlayerKey, PlayerKey>>
> = {
  "espn:4429096": "espn:4430737",
  "espn:4241474": "espn:4430807",
  "espn:4429013": "espn:3929630",
  "espn:4429501": "espn:4379399",
  "espn:4429059": "espn:4035538",
  "espn:4686658": "espn:4890973",
  "espn:4360761": "espn:4432708",
  "espn:4685247": "espn:4427366",
};
