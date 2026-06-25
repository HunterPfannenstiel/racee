export const LEAGUES_PATH = "leagues.json";
export const RACERS_PATH = "racers.json";
export const MOTORSPORTS_PATH = "motorsports.json";

export function motorsportRacesPath(motorsportId: string) {
  return `motorsports/${motorsportId}/races.json`;
}

export function leagueRaceConfigPath(leagueId: string, raceId: string) {
  return `leagues/${leagueId}/races/${raceId}/config.json`;
}

export function teamsPath(leagueId: string) {
  return `leagues/${leagueId}/teams.json`;
}

export function racesPath(leagueId: string) {
  return `leagues/${leagueId}/races.json`;
}

export function predictionsPath(leagueId: string, raceId: string) {
  return `leagues/${leagueId}/races/${raceId}/predictions.json`;
}

export function scoresPath(leagueId: string, raceId: string) {
  return `leagues/${leagueId}/races/${raceId}/scores.json`;
}

export function standingsPath(leagueId: string) {
  return `leagues/${leagueId}/standings.json`;
}
