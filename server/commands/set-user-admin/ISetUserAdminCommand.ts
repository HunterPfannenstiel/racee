export type SetUserAdminPayload = {
  userId: string;
  isAdmin: boolean;
};

export type SetUserAdminResult = {
  id: string;
  name: string;
  isAdmin: boolean;
};

export interface ISetUserAdminCommand {
  execute(payload: SetUserAdminPayload): Promise<SetUserAdminResult>;
}
