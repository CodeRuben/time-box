import { writeFileSync } from "node:fs";

const NFL_TEAMS = [
  "ARI", "ATL", "BAL", "BUF", "CAR", "CHI", "CIN", "CLE", "DAL", "DEN", "DET", "GB",
  "HOU", "IND", "JAX", "KC", "LAC", "LAR", "LV", "MIA", "MIN", "NE", "NO", "NYG", "NYJ",
  "PHI", "PIT", "SEA", "SF", "TB", "TEN", "WAS",
];

const ESPN_ABBREVIATION_TO_TEAM = { WSH: "WAS" };
const OUTPUT_PATH = "lib/draft-rankings/nfl-schedule-2026.ts";
const SEASON = 2026;
const REGULAR_SEASON_WEEKS = 18;
const EXPECTED_GAME_COUNT = 272;

function normalizeTeamAbbreviation(abbreviation) {
  const normalized = ESPN_ABBREVIATION_TO_TEAM[abbreviation] ?? abbreviation;
  if (!NFL_TEAMS.includes(normalized)) {
    throw new Error(`Unknown team abbreviation: ${abbreviation}`);
  }
  return normalized;
}

function gameKey({ week, homeTeam, awayTeam }) {
  return `${week}:${awayTeam}@${homeTeam}`;
}

async function fetchWeekSchedule(week) {
  const url = new URL("https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard");
  url.searchParams.set("seasontype", "2");
  url.searchParams.set("week", String(week));
  url.searchParams.set("dates", String(SEASON));

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`ESPN scoreboard request failed for week ${week}: ${response.status}`);
  }

  const data = await response.json();
  const events = data.events ?? [];
  if (events.length === 0) {
    throw new Error(`No games returned for week ${week}`);
  }

  return events.map((event) => {
    const competitors = event.competitions?.[0]?.competitors ?? [];
    const home = competitors.find((competitor) => competitor.homeAway === "home");
    const away = competitors.find((competitor) => competitor.homeAway === "away");
    if (!home?.team?.abbreviation || !away?.team?.abbreviation) {
      throw new Error(`Missing competitors for event ${event.id ?? "unknown"}`);
    }

    const homeTeam = normalizeTeamAbbreviation(home.team.abbreviation);
    const awayTeam = normalizeTeamAbbreviation(away.team.abbreviation);
    if (homeTeam === awayTeam) {
      throw new Error(`Self matchup in week ${week}: ${homeTeam}`);
    }

    return { week, homeTeam, awayTeam };
  });
}

function validateSchedule(games) {
  if (games.length !== EXPECTED_GAME_COUNT) {
    throw new Error(`Expected ${EXPECTED_GAME_COUNT} games, received ${games.length}`);
  }

  const uniqueGames = new Set(games.map(gameKey));
  if (uniqueGames.size !== games.length) {
    throw new Error("Duplicate games detected in schedule snapshot");
  }

  const weeks = new Set(games.map((game) => game.week));
  if (weeks.size !== REGULAR_SEASON_WEEKS) {
    throw new Error(`Expected ${REGULAR_SEASON_WEEKS} weeks, received ${weeks.size}`);
  }

  const gamesByTeam = Object.fromEntries(NFL_TEAMS.map((team) => [team, []]));
  for (const game of games) {
    gamesByTeam[game.homeTeam].push(game);
    gamesByTeam[game.awayTeam].push(game);
  }

  for (const team of NFL_TEAMS) {
    const teamGames = gamesByTeam[team];
    if (teamGames.length !== 17) {
      throw new Error(`${team} has ${teamGames.length} games, expected 17`);
    }

    const teamWeeks = new Set(teamGames.map((game) => game.week));
    if (teamWeeks.size !== 17) {
      throw new Error(`${team} has duplicate week assignments`);
    }

    const missingWeeks = [];
    for (let week = 1; week <= REGULAR_SEASON_WEEKS; week += 1) {
      if (!teamWeeks.has(week)) missingWeeks.push(week);
    }

    if (missingWeeks.length !== 1) {
      throw new Error(`${team} is missing ${missingWeeks.length} weeks, expected exactly one bye`);
    }
  }
}

function formatGeneratedFile(games) {
  const gameLines = games
    .map((game) => `  { week: ${game.week}, homeTeam: "${game.homeTeam}", awayTeam: "${game.awayTeam}" },`)
    .join("\n");

  return `import type { NflTeam } from "./types";

export interface NflScheduleGame {
  week: number;
  homeTeam: NflTeam;
  awayTeam: NflTeam;
}

export const NFL_SCHEDULE_2026: readonly NflScheduleGame[] = [
${gameLines}
] as const;
`;
}

async function importSchedule() {
  const games = [];
  for (let week = 1; week <= REGULAR_SEASON_WEEKS; week += 1) {
    games.push(...(await fetchWeekSchedule(week)));
  }

  games.sort((left, right) => {
    if (left.week !== right.week) return left.week - right.week;
    if (left.homeTeam !== right.homeTeam) return left.homeTeam.localeCompare(right.homeTeam);
    return left.awayTeam.localeCompare(right.awayTeam);
  });

  validateSchedule(games);
  writeFileSync(OUTPUT_PATH, formatGeneratedFile(games), "utf8");
  console.log(`Wrote ${games.length} games to ${OUTPUT_PATH}`);
}

await importSchedule();
