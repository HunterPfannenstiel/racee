import type { User } from "@/server/domain/user";
export interface IUserRepository {
  findById(userId: string): Promise<User | null>;
  findByIds(userIds: string[]): Promise<User[]>;
  findAll(): Promise<User[]>;
  update(userId: string, name: string): Promise<User>;
}
