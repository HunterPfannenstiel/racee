export type UserDTO = {
  id: string;
  name: string;
  isAdmin: boolean;
};

export interface IUsersQuery {
  execute(): Promise<UserDTO[]>;
}
