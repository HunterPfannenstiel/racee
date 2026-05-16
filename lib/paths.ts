export const SEASONS_PATH = "seasons.json";
export const RACERS_PATH = "racers.json";

export function racePath(seasonId: string, raceId: string) {
  return `seasons/${seasonId}/races/${raceId}/race.json`;
}
