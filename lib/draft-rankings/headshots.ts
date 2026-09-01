export function getTeamLogo(nflTeam: string): string {
  return `https://a.espncdn.com/i/teamlogos/nfl/500/scoreboard/${nflTeam.toLowerCase()}.png`;
}

export function getPlayerHeadshotUrl(espnId: string): string {
  return `https://a.espncdn.com/i/headshots/nfl/players/full/${espnId}.png`;
}

export function isTeamLogoHeadshot(headshot: string): boolean {
  return headshot.includes("/i/teamlogos/");
}
