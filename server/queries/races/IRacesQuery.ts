import type { Race as RaceDTO } from "@/lib/schemas";

export type RacesQueryInput = { motorsportId: string } | { leagueId: string };

export interface IRacesQuery {
  execute(input: RacesQueryInput): Promise<RaceDTO[]>;
}
