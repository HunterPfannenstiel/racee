export type CreateRacerPayload = {
  racerId: string;
  name: string;
  team: string;
  motorsportId: string;
  image?: string;
  teamColor?: string;
};

export type CreateRacerResult = {
  id: string;
  name: string;
  team: string;
  motorsportId: string;
  image?: string;
  teamColor?: string;
};

export interface ICreateRacerCommand {
  execute(payload: CreateRacerPayload): Promise<CreateRacerResult>;
}
