import { z } from "zod";
import { adminOnly } from "@/server/rpc/procedures";
import { PrismaUserRepository } from "@/server/repositories/user/PrismaUserRepository";
import { PrismaUsersQuery } from "@/server/queries/users/PrismaUsersQuery";
import { PrismaSetUserAdminCommand } from "@/server/commands/set-user-admin/PrismaSetUserAdminCommand";

const userRepo = new PrismaUserRepository();

const usersQuery = new PrismaUsersQuery(userRepo);
const setUserAdminCommand = new PrismaSetUserAdminCommand(userRepo);

// Exported so frontend components can type their props off the actual output schema
// instead of hand-writing a parallel `{ id, name, isAdmin }` type (per app/AGENTS.md).
export const UserDTOSchema = z.object({
  id: z.string(),
  name: z.string(),
  isAdmin: z.boolean(),
});
export type UserDTO = z.infer<typeof UserDTOSchema>;

export const usersRouter = {
  /**
   * All users, including their admin flag. Site-admin only — the legacy
   * `GET /api/users` was public and leaked `isAdmin` to any visitor; locking it down
   * here is intended per the migration brief.
   */
  list: adminOnly
    .output(z.array(UserDTOSchema))
    .handler(async () => usersQuery.execute()),

  /** Grants or revokes site-admin on a user. Site-admin only. */
  setAdmin: adminOnly
    .input(z.object({ userId: z.string(), isAdmin: z.boolean() }))
    .output(UserDTOSchema)
    .handler(async ({ input }) => setUserAdminCommand.execute(input)),
};
