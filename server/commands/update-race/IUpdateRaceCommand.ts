import type { Race as RaceDTO } from "@/lib/schemas";

export type UpdateRacePatch = Partial<{
  title: string;
  label: string;
  date: string;
  lockTime: string;
}>;

export type UpdateRacePayload = {
  motorsportId: string;
  raceId: string;
  patch: UpdateRacePatch;
};

export interface IUpdateRaceCommand {
  execute(payload: UpdateRacePayload): Promise<RaceDTO>;
}
