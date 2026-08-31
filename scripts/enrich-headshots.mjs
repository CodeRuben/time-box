import { readFileSync, writeFileSync } from "node:fs";

const playersSource = readFileSync("lib/draft-rankings/players.ts", "utf8");
const headshotsPath = "lib/draft-rankings/headshots.ts";
const headshotsSource = readFileSync(headshotsPath, "utf8");

const players = [
  ...playersSource.matchAll(/\[\s*"([^"]+)",\s*"([^"]+)",\s*"([^"]+)"\s*\]/g),
].map((match) => ({
  name: match[1],
  position: match[2],
  nflTeam: match[3],
}));

const existingIds = new Map(
  [...headshotsSource.matchAll(/"([^"]+)":\s*"(\d+)"/g)].map((match) => [
    match[1],
    match[2],
  ]),
);

const missing = players.filter(
  (player) => player.position !== "DST" && !existingIds.has(player.name),
);

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

  const teamMatch = items.find(
    (item) =>
      item.teamRelationships?.[0]?.core?.abbreviation === nflTeam &&
      item.displayName === name,
  );
  if (teamMatch) {
    return teamMatch.id;
  }

  const exactNameMatch = items.find((item) => item.displayName === name);
  if (exactNameMatch) {
    return exactNameMatch.id;
  }

  const fuzzyTeamMatch = items.find(
    (item) => item.teamRelationships?.[0]?.core?.abbreviation === nflTeam,
  );
  return fuzzyTeamMatch?.id ?? null;
}

const found = [];
const notFound = [];

for (const player of missing) {
  const espnId = await searchEspnPlayer(player.name, player.nflTeam);
  if (espnId) {
    existingIds.set(player.name, espnId);
    found.push({ ...player, espnId });
    console.log(`✓ ${player.name} -> ${espnId}`);
  } else {
    notFound.push(player);
    console.log(`✗ ${player.name} (${player.position}, ${player.nflTeam})`);
  }

  await new Promise((resolve) => setTimeout(resolve, 150));
}

const entries = [...existingIds.entries()].sort(([left], [right]) =>
  left.localeCompare(right),
);

const lines = entries.map(
  ([name, espnId]) => `  "${name.replace(/"/g, '\\"')}": "${espnId}",`,
);

const output = `import type { Position } from "./types";

const ESPN_PLAYER_IDS_BY_NAME: Readonly<Partial<Record<string, string>>> = {
${lines.join("\n")}
};

function getTeamLogo(nflTeam: string): string {
  return \`https://a.espncdn.com/i/teamlogos/nfl/500/scoreboard/\${nflTeam.toLowerCase()}.png\`;
}

export function getPlayerHeadshot(
  playerName: string,
  position: Position,
  nflTeam: string,
): string | null {
  const espnId = ESPN_PLAYER_IDS_BY_NAME[playerName];
  if (espnId) {
    return \`https://a.espncdn.com/i/headshots/nfl/players/full/\${espnId}.png\`;
  }

  if (position === "DST") {
    return getTeamLogo(nflTeam);
  }

  return null;
}

export function isTeamLogoHeadshot(headshot: string): boolean {
  return headshot.includes("/i/teamlogos/");
}
`;

writeFileSync(headshotsPath, output);

console.log(`\nFound ${found.length} new IDs`);
console.log(`Still missing ${notFound.length}`);
for (const player of notFound) {
  console.log(`  - ${player.name}`);
}
