import { readFileSync } from "node:fs";

const playersSource = readFileSync("lib/draft-rankings/players.ts", "utf8");
const headshotsSource = readFileSync("lib/draft-rankings/headshots.ts", "utf8");

const players = [
  ...playersSource.matchAll(/\[\s*"([^"]+)",\s*"([^"]+)",\s*"([^"]+)"\s*\]/g),
].map((match) => ({
  name: match[1],
  position: match[2],
  nflTeam: match[3],
}));

const headshotNames = new Set(
  [...headshotsSource.matchAll(/"([^"]+)":\s*"\d+"/g)].map((match) => match[1]),
);

const missing = players.filter((player) => !headshotNames.has(player.name));
console.log(`Missing: ${missing.length}`);
for (const player of missing) {
  console.log(`${player.name}\t${player.position}\t${player.nflTeam}`);
}
