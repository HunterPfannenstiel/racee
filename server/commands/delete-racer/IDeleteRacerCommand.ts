export type DeleteRacerPayload = {
  racerId: string;
};

export interface IDeleteRacerCommand {
  execute(payload: DeleteRacerPayload): Promise<void>;
}
