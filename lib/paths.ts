export const SEASONS_PATH = "seasons.json";
export const RACERS_PATH = "racers.json";

export function racePath(seasonId: string, raceId: string) {
  return `seasons/${seasonId}/races/${raceId}/race.json`;
}

export function predictionPath(seasonId: string, raceId: string, userId: string) {
  return `seasons/${seasonId}/races/${raceId}/predictions/${userId}.json`;
}

export function keyPath(seasonId: string, raceId: string) {
  return `seasons/${seasonId}/races/${raceId}/predictions/key.json`;
}

export function scoresPath(seasonId: string, raceId: string) {
  return `seasons/${seasonId}/races/${raceId}/scores.json`;
}
