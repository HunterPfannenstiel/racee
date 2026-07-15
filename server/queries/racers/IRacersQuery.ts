export type RacerDTO = {
  id: string;
  name: string;
  team: string;
  motorsportId: string;
  image?: string;
  teamColor?: string;
};

export interface IRacersQuery {
  execute(): Promise<RacerDTO[]>;
}
