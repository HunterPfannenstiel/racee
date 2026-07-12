import type { IUserRepository } from "@/server/repositories/interfaces";
import type { IUpdateNameCommand, UpdateNamePayload, UpdateNameResult } from "./IUpdateNameCommand";

export class PrismaUpdateNameCommand implements IUpdateNameCommand {
  constructor(private users: IUserRepository) {}

  async execute(payload: UpdateNamePayload): Promise<UpdateNameResult> {
    const user = await this.users.update(payload.userId, payload.name);
    return { id: user.userId, name: user.name, isAdmin: user.isAdmin };
  }
}
