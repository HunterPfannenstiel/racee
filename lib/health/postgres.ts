import { prisma } from "@/server/db";
import { withTimeout } from "@/lib/health/timeout";

const TIMEOUT_MS = 5000;

export async function checkPostgres(): Promise<{ ok: boolean; detail?: string }> {
  if (!process.env.DATABASE_URL?.trim()) {
    return { ok: false, detail: "skipped: missing DATABASE_URL" };
  }

  try {
    await withTimeout(prisma.$queryRaw`SELECT 1`, TIMEOUT_MS);
    return { ok: true };
  } catch (err) {
    return { ok: false, detail: err instanceof Error ? err.message : "unknown error" };
  }
}
