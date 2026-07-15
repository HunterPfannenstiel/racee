export type UpdateUserNamePayload = {
  userId: string;
  name: string;
};

export type UpdateUserNameResult = {
  id: string;
  name: string;
  isAdmin: boolean;
};

export interface IUpdateUserNameCommand {
  execute(payload: UpdateUserNamePayload): Promise<UpdateUserNameResult>;
}
