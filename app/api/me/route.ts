import { z } from "zod";
import { getSession } from "@/server/auth/server";
import { PrismaUserRepository } from "@/server/repositories/prisma/PrismaUserRepository";

const UpdateMeSchema = z.object({
  name: z.string().min(1).max(30),
});

const repo = new PrismaUserRepository();

export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = UpdateMeSchema.safeParse(await req.json());
  if (!parsed.success) return Response.json({ error: "Invalid name" }, { status: 400 });

  const user = await repo.update(session.user.id, parsed.data.name);
  return Response.json(user);
}
