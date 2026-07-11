import { PrismaClient } from "@/server/generated/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { withSchema } from "@/server/db-url";

const adapter = new PrismaPg({
  connectionString: withSchema(process.env.DATABASE_URL!, process.env.DATABASE_SCHEMA),
});

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
