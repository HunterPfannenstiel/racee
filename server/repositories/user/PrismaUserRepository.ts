import { prisma } from "@/server/db";
import type { User } from "@/server/domain/user";
import type { IUserRepository } from "./IUserRepository";

const SELECT = { id: true, name: true, isAdmin: true } as const;

function toDomain(raw: { id: string; name: string; isAdmin: boolean }): User {
  return { userId: raw.id, name: raw.name, isAdmin: raw.isAdmin };
}

export class PrismaUserRepository implements IUserRepository {
  async findById(userId: string): Promise<User | null> {
    const raw = await prisma.user.findUnique({ where: { id: userId }, select: SELECT });
    return raw ? toDomain(raw) : null;
  }

  async findByIds(userIds: string[]): Promise<User[]> {
    const rows = await prisma.user.findMany({ where: { id: { in: userIds } }, select: SELECT });
    return rows.map(toDomain);
  }

  async findAll(): Promise<User[]> {
    const rows = await prisma.user.findMany({ select: SELECT });
    return rows.map(toDomain);
  }

  async update(userId: string, name: string): Promise<User> {
    const row = await prisma.user.update({
      where: { id: userId },
      data: { name },
      select: SELECT,
    });
    return toDomain(row);
  }

  async updateIsAdmin(userId: string, isAdmin: boolean): Promise<User> {
    const row = await prisma.user.update({
      where: { id: userId },
      data: { isAdmin },
      select: SELECT,
    });
    return toDomain(row);
  }
}
