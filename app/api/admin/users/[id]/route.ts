import { NextResponse } from "next/server";
import { z } from "zod";
import { PrismaUserRepository } from "@/server/repositories/prisma/PrismaUserRepository";
import { AuthError, requireAdmin } from "@/server/auth/guards";

const userRepo = new PrismaUserRepository();

const PatchSchema = z.object({ isAdmin: z.boolean() });

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const parsed = PatchSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    const user = await userRepo.updateIsAdmin(id, parsed.data.isAdmin);
    return NextResponse.json({ id: user.userId, name: user.name, isAdmin: user.isAdmin });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }
}
