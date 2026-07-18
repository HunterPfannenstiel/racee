export type UpdateRacerPatch = Partial<{
  name: string;
  team: string;
  image: string;
  teamColor: string;
}>;

export type UpdateRacerPayload = {
  racerId: string;
  patch: UpdateRacerPatch;
};

export type UpdateRacerResult = {
  id: string;
  name: string;
  team: string;
  motorsportId: string;
  image?: string;
  teamColor?: string;
};

export interface IUpdateRacerCommand {
  execute(payload: UpdateRacerPayload): Promise<UpdateRacerResult>;
}
