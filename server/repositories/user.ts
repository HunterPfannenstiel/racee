import { prisma } from "@/server/db";

export async function getUsersByIds(ids: string[]) {
  return prisma.user.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true },
  });
}

// For seeding only — real users are created automatically by better-auth on first sign-in.
export async function createUser({ id, name, email }: { id: string; name: string; email?: string }) {
  return prisma.user.create({
    data: { id, name, email, emailVerified: false, updatedAt: new Date() },
    select: { id: true, name: true, email: true },
  });
}
