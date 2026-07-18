import type { Race as RaceDTO } from "@/lib/schemas";

export type CreateRacePayload = {
  raceId: string;
  motorsportId: string;
  title: string;
  label?: string;
  date: string;
  lockTime?: string;
  startingGrid: string[];
};

export interface ICreateRaceCommand {
  execute(payload: CreateRacePayload): Promise<RaceDTO>;
}
