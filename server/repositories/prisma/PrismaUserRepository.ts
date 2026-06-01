import { prisma } from "@/server/db";
import type { User } from "@/server/domain/user";
import type { IUserRepository } from "../interfaces/IUserRepository";

function toDomain(raw: { id: string; name: string }): User {
  return { userId: raw.id, name: raw.name };
}

export class PrismaUserRepository implements IUserRepository {
  async findById(userId: string): Promise<User | null> {
    const raw = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true } });
    return raw ? toDomain(raw) : null;
  }

  async findByIds(userIds: string[]): Promise<User[]> {
    const rows = await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true } });
    return rows.map(toDomain);
  }

  async findAll(): Promise<User[]> {
    const rows = await prisma.user.findMany({ select: { id: true, name: true } });
    return rows.map(toDomain);
  }

  async update(userId: string, name: string): Promise<User> {
    const row = await prisma.user.update({
      where: { id: userId },
      data: { name },
      select: { id: true, name: true },
    });
    return toDomain(row);
  }
}
