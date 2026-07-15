import type { IUserRepository } from "@/server/repositories";
import type { User } from "@/server/domain/user";
import type { IUsersQuery, UserDTO } from "./IUsersQuery";

function serialize(u: User): UserDTO {
  return { id: u.userId, name: u.name, isAdmin: u.isAdmin };
}

export class PrismaUsersQuery implements IUsersQuery {
  constructor(private users: IUserRepository) {}

  async execute(): Promise<UserDTO[]> {
    const all = await this.users.findAll();
    return all.map(serialize);
  }
}
