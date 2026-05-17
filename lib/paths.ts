export const SEASONS_PATH = "seasons.json";
export const RACERS_PATH = "racers.json";
export const PARTICIPANTS_PATH = "participants.json";

export function teamsPath(seasonId: string) {
  return `seasons/${seasonId}/teams.json`;
}

export function racesPath(seasonId: string) {
  return `seasons/${seasonId}/races.json`;
}

export function predictionsPath(seasonId: string, raceId: string) {
  return `seasons/${seasonId}/races/${raceId}/predictions.json`;
}

export function scoresPath(seasonId: string, raceId: string) {
  return `seasons/${seasonId}/races/${raceId}/scores.json`;
}

export function standingsPath(seasonId: string) {
  return `seasons/${seasonId}/standings.json`;
}
