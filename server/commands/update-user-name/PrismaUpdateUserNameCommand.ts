import type { IUserRepository } from "@/server/repositories";
import type {
  IUpdateUserNameCommand,
  UpdateUserNamePayload,
  UpdateUserNameResult,
} from "./IUpdateUserNameCommand";

export class PrismaUpdateUserNameCommand implements IUpdateUserNameCommand {
  constructor(private users: IUserRepository) {}

  async execute(payload: UpdateUserNamePayload): Promise<UpdateUserNameResult> {
    const user = await this.users.update(payload.userId, payload.name);
    return { id: user.userId, name: user.name, isAdmin: user.isAdmin };
  }
}
