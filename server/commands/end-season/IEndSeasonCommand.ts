export type EndSeasonPayload = {
  leagueId: string;
  actorUserId: string;
};

export interface IEndSeasonCommand {
  execute(payload: EndSeasonPayload): Promise<void>;
}
