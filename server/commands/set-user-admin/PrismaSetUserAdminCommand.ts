import { NotFoundError } from "@/server/domain/errors";
import type { IUserRepository } from "@/server/repositories";
import type {
  ISetUserAdminCommand,
  SetUserAdminPayload,
  SetUserAdminResult,
} from "./ISetUserAdminCommand";

export class PrismaSetUserAdminCommand implements ISetUserAdminCommand {
  constructor(private users: IUserRepository) {}

  async execute(payload: SetUserAdminPayload): Promise<SetUserAdminResult> {
    const existing = await this.users.findById(payload.userId);
    if (!existing) {
      throw new NotFoundError("User", payload.userId);
    }

    const user = await this.users.updateIsAdmin(payload.userId, payload.isAdmin);
    return { id: user.userId, name: user.name, isAdmin: user.isAdmin };
  }
}
