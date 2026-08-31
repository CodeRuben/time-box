import { readFileSync, writeFileSync } from "node:fs";

const csvPath = process.argv[2];
if (!csvPath) {
  throw new Error(
    "Usage: node scripts/import-draft-rankings-csv.mjs <csv-path>",
  );
}

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
    /\[\s*"([^"]+)",\s*"([^"]+)",\s*"([^"]+)"\s*\]/g,
  ),
].map((match, index) => ({
  name: match[1],
  position: match[2],
  nflTeam: match[3],
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

const csvLines = readFileSync(csvPath, "utf8").trim().split(/\r?\n/).slice(1);
const csvRows = csvLines
  .map((line) => {
    const [rank, player, pos, team, avg, expert] = parseCsvLine(line);
    const position = csvPosToPosition(pos);
    if (!position) {
      return null;
    }

    return {
      rank,
      player,
      pos,
      team,
      position,
      expert: expert === "" ? null : Number(expert),
      avg: avg === "" ? null : Number(avg),
    };
  })
  .filter(Boolean);

const csvByKey = new Map();
for (const row of csvRows) {
  const key =
    row.position === "DST"
      ? `dst:${row.team}`
      : `${normalizeName(row.player)}:${row.position}:${row.team}`;

  if (!csvByKey.has(key)) {
    csvByKey.set(key, row);
  }
}

function lastName(name) {
  const parts = normalizeName(name).split(" ");
  return parts[parts.length - 1] ?? "";
}

function findCsvRow(player) {
  const keys = [
    player.position === "DST"
      ? `dst:${player.nflTeam}`
      : `${normalizeName(player.name)}:${player.position}:${player.nflTeam}`,
  ];

  if (player.position !== "DST") {
    keys.push(`${normalizeName(player.name)}:${player.position}`);
  }

  for (const key of keys) {
    const row = csvByKey.get(key);
    if (row) {
      return row;
    }
  }

  const nameMatches = csvRows.filter(
    (row) =>
      row.position === player.position &&
      normalizeName(row.player) === normalizeName(player.name),
  );
  if (nameMatches.length === 1) {
    return nameMatches[0];
  }

  const lastNameMatches = csvRows.filter(
    (row) =>
      row.position === player.position &&
      row.team === player.nflTeam &&
      lastName(row.player) === lastName(player.name),
  );
  return lastNameMatches.length === 1 ? lastNameMatches[0] : null;
}

const enriched = currentPlayers.map((player) => {
  const csv = findCsvRow(player);
  return {
    ...player,
    expert: csv?.expert ?? null,
    avg: csv?.avg ?? null,
    csvName: csv?.player ?? null,
  };
});

const unmatched = enriched.filter(
  (player) => player.expert === null && player.avg === null,
);
if (unmatched.length > 0) {
  console.warn(
    `Warning: ${unmatched.length} players not found in CSV (kept at end by old rank):`,
  );
  for (const player of unmatched) {
    console.warn(` - ${player.name} (${player.position}, ${player.nflTeam})`);
  }
}

function sortKey(player) {
  if (player.expert !== null) {
    return [0, player.expert, player.avg ?? 9999, player.oldRank];
  }

  if (player.avg !== null) {
    return [1, player.avg, player.oldRank];
  }

  return [2, player.oldRank];
}

const sorted = [...enriched].sort((left, right) => {
  const leftKey = sortKey(left);
  const rightKey = sortKey(right);

  for (let index = 0; index < leftKey.length; index += 1) {
    if (leftKey[index] !== rightKey[index]) {
      return leftKey[index] - rightKey[index];
    }
  }

  return 0;
});

const playerDataLines = sorted.map(
  (player) => `  ["${player.name}", "${player.position}", "${player.nflTeam}"],`,
);

const updatedSource = playersSource.replace(
  /const PLAYER_DATA: PlayerData\[\] = \[[\s\S]*?\];/,
  `const PLAYER_DATA: PlayerData[] = [\n${playerDataLines.join("\n")}\n];`,
);

writeFileSync(playersPath, updatedSource);

console.log(`Updated ${sorted.length} players in lib/draft-rankings/players.ts`);
console.log("Top 15:");
for (const [index, player] of sorted.slice(0, 15).entries()) {
  console.log(
    `${index + 1}. ${player.name} (expert: ${player.expert ?? `avg ${player.avg}`})`,
  );
}
