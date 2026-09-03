import { readFileSync, writeFileSync } from "node:fs";

const csvPath = process.argv[2];
const limit = Number(process.argv[3] ?? 250);
if (!csvPath || !Number.isInteger(limit) || limit < 1) {
  throw new Error(
    "Usage: node scripts/import-draft-rankings-csv.mjs <csv-path> [limit]",
  );
}

const NFL_TEAMS = new Set([
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
]);

const playersPath = new URL(
  "../lib/draft-rankings/players.ts",
  import.meta.url,
);

const playersSource = readFileSync(playersPath, "utf8");
const playerDataMatch = playersSource.match(
  /const PLAYER_DATA: PlayerData\[\] = \[([\s\S]*?)\];/,
);
if (!playerDataMatch) {
  throw new Error("PLAYER_DATA not found");
}

const currentPlayers = [
  ...playerDataMatch[1].matchAll(
    /\[\s*"([^"]+)",\s*"([^"]+)",\s*"([^"]+)"(?:,\s*"([^"]+)")?\s*\]/g,
  ),
].map((match, index) => ({
  name: match[1],
  position: match[2],
  nflTeam: match[3],
  espnId: match[4] ?? null,
  oldRank: index + 1,
}));

function normalizeName(name) {
  return name
    .toLowerCase()
    .replace(/[''.`]/g, "")
    .replace(/\./g, "")
    .replace(/\s+jr$/i, "")
    .replace(/\s+sr$/i, "")
    .replace(/\s+ii$/i, "")
    .replace(/\s+iii$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function csvPosToPosition(pos) {
  if (!pos) {
    return null;
  }

  if (pos.startsWith("DEF")) {
    return "DST";
  }

  const match = pos.match(/^(QB|RB|WR|TE|K)/);
  return match ? match[1] : null;
}

function parseCsvLine(line) {
  const parts = [];
  let current = "";
  let inQuotes = false;

  for (const character of line) {
    if (character === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (character === "," && !inQuotes) {
      parts.push(current);
      current = "";
      continue;
    }

    current += character;
  }

  parts.push(current);
  return parts;
}

function lastName(name) {
  const parts = normalizeName(name).split(" ");
  return parts[parts.length - 1] ?? "";
}

const csvLines = readFileSync(csvPath, "utf8").trim().split(/\r?\n/).slice(1);
const csvRows = csvLines
  .map((line, csvIndex) => {
    const [rank, player, pos, team, avg, expert] = parseCsvLine(line);
    const position = csvPosToPosition(pos);
    if (!position || !NFL_TEAMS.has(team)) {
      return null;
    }

    const expertRank = expert === "" ? null : Number(expert);
    const avgRank = avg === "" ? null : Number(avg);
    if (expertRank === null && avgRank === null) {
      return null;
    }

    return {
      csvIndex,
      rank,
      player,
      pos,
      team,
      position,
      expert: expertRank,
      avg: avgRank,
    };
  })
  .filter(Boolean);

function findCurrentPlayer(row) {
  if (row.position === "DST") {
    return (
      currentPlayers.find(
        (player) => player.position === "DST" && player.nflTeam === row.team,
      ) ?? null
    );
  }

  const nameMatches = currentPlayers.filter(
    (player) =>
      player.position === row.position &&
      normalizeName(player.name) === normalizeName(row.player),
  );
  if (nameMatches.length === 1) {
    return nameMatches[0];
  }

  const lastNameMatches = currentPlayers.filter(
    (player) =>
      player.position === row.position &&
      player.nflTeam === row.team &&
      lastName(player.name) === lastName(row.player),
  );
  return lastNameMatches.length === 1 ? lastNameMatches[0] : null;
}

function sortKey(row) {
  return [row.expert ?? row.avg ?? 9999, row.avg ?? 9999, row.csvIndex];
}

const rankedRows = [...csvRows].sort((left, right) => {
  const leftKey = sortKey(left);
  const rightKey = sortKey(right);

  for (let index = 0; index < leftKey.length; index += 1) {
    if (leftKey[index] !== rightKey[index]) {
      return leftKey[index] - rightKey[index];
    }
  }

  return 0;
});

function takeUniqueFranchiseSpecialists(rows) {
  const seen = { K: new Set(), DST: new Set() };
  const kept = [];

  for (const row of rows) {
    if (row.position === "K" || row.position === "DST") {
      if (seen[row.position].has(row.team)) {
        continue;
      }
      seen[row.position].add(row.team);
    }

    kept.push(row);
  }

  return kept;
}

const uniqueRows = takeUniqueFranchiseSpecialists(rankedRows);

async function searchEspnPlayer(name, nflTeam) {
  const url = new URL("https://site.api.espn.com/apis/common/v3/search");
  url.searchParams.set("query", name);
  url.searchParams.set("limit", "10");
  url.searchParams.set("type", "player");
  url.searchParams.set("sport", "football");
  url.searchParams.set("league", "nfl");

  const response = await fetch(url);
  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  const items = data.items ?? [];
  const normalized = normalizeName(name);

  const teamMatch = items.find(
    (item) =>
      item.teamRelationships?.[0]?.core?.abbreviation === nflTeam &&
      normalizeName(item.displayName ?? "") === normalized,
  );
  if (teamMatch) {
    return String(teamMatch.id);
  }

  const exactNameMatch = items.find(
    (item) => normalizeName(item.displayName ?? "") === normalized,
  );
  if (exactNameMatch) {
    return String(exactNameMatch.id);
  }

  const fuzzyTeamMatch = items.find(
    (item) => item.teamRelationships?.[0]?.core?.abbreviation === nflTeam,
  );
  return fuzzyTeamMatch ? String(fuzzyTeamMatch.id) : null;
}

const searchCache = new Map();

async function espnIdFor(name, nflTeam) {
  const cacheKey = `${normalizeName(name)}:${nflTeam}`;
  if (searchCache.has(cacheKey)) {
    return searchCache.get(cacheKey);
  }

  const queries = [name];
  const stripped = name
    .replace(/\s+Jr\.?$/i, "")
    .replace(/\s+Sr\.?$/i, "")
    .replace(/\s+II$/i, "")
    .replace(/\s+III$/i, "")
    .trim();
  if (stripped !== name) {
    queries.push(stripped);
  }

  let espnId = null;
  for (const query of queries) {
    espnId = await searchEspnPlayer(query, nflTeam);
    if (espnId) {
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 150));
  }

  searchCache.set(cacheKey, espnId);
  return espnId;
}

const selected = [];
const skipped = [];
const usedEspnIds = new Set();
const usedKeys = new Set();

for (const row of uniqueRows) {
  if (selected.length >= limit) {
    break;
  }

  const current = findCurrentPlayer(row);
  const name = current?.name ?? row.player;
  const playerKey =
    row.position === "DST"
      ? `team:${row.team}`
      : `${row.position}:${normalizeName(name)}`;

  if (usedKeys.has(playerKey)) {
    skipped.push(`${name} (${row.position}, ${row.team}) duplicate`);
    continue;
  }

  if (row.position === "DST") {
    usedKeys.add(playerKey);
    selected.push({
      name,
      position: row.position,
      nflTeam: row.team,
      espnId: null,
      expert: row.expert,
      avg: row.avg,
    });
    continue;
  }

  let espnId = current?.espnId ?? null;
  if (!espnId) {
    espnId = await espnIdFor(name, row.team);
    if (espnId) {
      console.log(`✓ ${name} -> ${espnId}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 150));
  }

  if (!espnId || usedEspnIds.has(espnId)) {
    skipped.push(`${name} (${row.position}, ${row.team})`);
    console.warn(`✗ no ESPN id for ${name} (${row.position}, ${row.team})`);
    continue;
  }

  usedEspnIds.add(espnId);
  usedKeys.add(playerKey);
  selected.push({
    name,
    position: row.position,
    nflTeam: row.team,
    espnId,
    expert: row.expert,
    avg: row.avg,
  });
}

if (selected.length < limit) {
  throw new Error(
    `Only resolved ${selected.length} of ${limit} players. Skipped:\n - ${skipped.join("\n - ")}`,
  );
}

const playerDataLines = selected.map((player) =>
  player.position === "DST"
    ? `  ["${player.name}", "DST", "${player.nflTeam}"],`
    : `  ["${player.name}", "${player.position}", "${player.nflTeam}", "${player.espnId}"],`,
);

const updatedSource = playersSource.replace(
  /const PLAYER_DATA: PlayerData\[\] = \[[\s\S]*?\];/,
  `const PLAYER_DATA: PlayerData[] = [\n${playerDataLines.join("\n")}\n];`,
);

writeFileSync(playersPath, updatedSource);

console.log(
  `Updated ${selected.length} players in lib/draft-rankings/players.ts`,
);
if (skipped.length > 0) {
  console.warn(`Skipped ${skipped.length} players without ESPN ids:`);
  for (const player of skipped) {
    console.warn(` - ${player}`);
  }
}
console.log("Top 15:");
for (const [index, player] of selected.slice(0, 15).entries()) {
  console.log(
    `${index + 1}. ${player.name} (expert: ${player.expert ?? `avg ${player.avg}`})`,
  );
}
