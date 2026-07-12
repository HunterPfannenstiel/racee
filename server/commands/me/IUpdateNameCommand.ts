export type UpdateNamePayload = {
  userId: string;
  name: string;
};

export type UpdateNameResult = {
  id: string;
  name: string;
  isAdmin: boolean;
};

export interface IUpdateNameCommand {
  execute(payload: UpdateNamePayload): Promise<UpdateNameResult>;
}
