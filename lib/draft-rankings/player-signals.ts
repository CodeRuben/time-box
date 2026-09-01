import {
  CONTINGENT_UPSIDE_DEPENDENCY_BY_PLAYER_KEY,
  INJURY_RISK_PLAYER_KEYS,
  ROOKIE_CLASS_YEAR,
  ROOKIE_PLAYER_KEYS,
  SEASON_OPENING_DATE,
  TEAM_OFFENSE_PROJECTIONS,
  VETERAN_AGE_THRESHOLDS,
  VETERAN_BIRTH_DATES_BY_PLAYER_KEY,
} from "./player-signal-data";
import type { Player, PlayerSignal } from "./types";

interface CalendarDate {
  year: number;
  month: number;
  day: number;
}

function parseCalendarDate(value: string): CalendarDate {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    throw new Error(`Invalid calendar date: ${value}`);
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new Error(`Invalid calendar date: ${value}`);
  }

  return { year, month, day };
}

export function calculateAgeOnDate(
  birthDateValue: string,
  comparisonDateValue: string,
): number {
  const birthDate = parseCalendarDate(birthDateValue);
  const comparisonDate = parseCalendarDate(comparisonDateValue);
  const birthdayHasPassed =
    comparisonDate.month > birthDate.month ||
    (comparisonDate.month === birthDate.month &&
      comparisonDate.day >= birthDate.day);

  return comparisonDate.year - birthDate.year - (birthdayHasPassed ? 0 : 1);
}

type SignalPlayer = Pick<Player, "key" | "position" | "nflTeam">;

function getVeteranAgeSignal(player: SignalPlayer): PlayerSignal | null {
  const threshold = VETERAN_AGE_THRESHOLDS[player.position];
  const birthDate = VETERAN_BIRTH_DATES_BY_PLAYER_KEY[player.key];
  if (!threshold || !birthDate) {
    return null;
  }

  const age = calculateAgeOnDate(birthDate, SEASON_OPENING_DATE);
  if (age < threshold) {
    return null;
  }

  return {
    kind: "veteran-age",
    age,
    threshold,
  };
}

function getOffenseSignal(player: SignalPlayer): PlayerSignal | null {
  const projection = TEAM_OFFENSE_PROJECTIONS[player.nflTeam];
  if (!projection || projection.tier === "mid") {
    return null;
  }

  return {
    kind: "offense-tier",
    tier: projection.tier,
    projectedPointsPerGame: projection.projectedPointsPerGame,
  };
}

export function getPlayerSignals(player: SignalPlayer): PlayerSignal[] {
  if (player.position === "K" || player.position === "DST") {
    return [];
  }

  const signals: PlayerSignal[] = [];

  if (INJURY_RISK_PLAYER_KEYS.has(player.key)) {
    signals.push({ kind: "injury-risk" });
  }

  const veteranAgeSignal = getVeteranAgeSignal(player);
  if (veteranAgeSignal) {
    signals.push(veteranAgeSignal);
  }

  if (ROOKIE_PLAYER_KEYS.has(player.key)) {
    signals.push({ kind: "rookie", classYear: ROOKIE_CLASS_YEAR });
  }

  const offenseSignal = getOffenseSignal(player);
  if (offenseSignal) {
    signals.push(offenseSignal);
  }

  const dependencyKey = CONTINGENT_UPSIDE_DEPENDENCY_BY_PLAYER_KEY[player.key];
  if (dependencyKey) {
    signals.push({
      kind: "contingent-upside",
      dependencyKey,
    });
  }

  return signals;
}
