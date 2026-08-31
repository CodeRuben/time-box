import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const oldPlayersSource = execSync("git show HEAD:lib/draft-rankings/players.ts", {
  encoding: "utf8",
});

const oldPlayers = [
  ...oldPlayersSource.matchAll(
    /\[\s*"([^"]+)",\s*"([^"]+)",\s*"([^"]+)"\s*\]/g,
  ),
].map((match, index) => ({
  rank: index + 1,
  name: match[1],
}));

const headshotsSource = readFileSync(
  new URL("../lib/draft-rankings/headshots.ts", import.meta.url),
  "utf8",
);

const rankToEspn = [
  ...headshotsSource.matchAll(/^\s*(\d+):\s*"(\d+)",/gm),
].map((match) => ({
  rank: Number(match[1]),
  espnId: match[2],
}));

const espnIdsByName = {};
for (const { rank, espnId } of rankToEspn) {
  const player = oldPlayers.find((entry) => entry.rank === rank);
  if (player) {
    espnIdsByName[player.name] = espnId;
  }
}

const entries = Object.entries(espnIdsByName).sort(([left], [right]) =>
  left.localeCompare(right),
);

const lines = entries.map(
  ([name, espnId]) => `  "${name.replace(/"/g, '\\"')}": "${espnId}",`,
);

const output = `const ESPN_PLAYER_IDS_BY_NAME: Readonly<Partial<Record<string, string>>> = {
${lines.join("\n")}
};

export function getPlayerHeadshot(playerName: string): string | null {
  const espnId = ESPN_PLAYER_IDS_BY_NAME[playerName];
  return espnId
    ? \`https://a.espncdn.com/i/headshots/nfl/players/full/\${espnId}.png\`
    : null;
}
`;

writeFileSync(
  new URL("../lib/draft-rankings/headshots.ts", import.meta.url),
  output,
);

console.log(`Wrote ${entries.length} name-based headshot mappings`);
