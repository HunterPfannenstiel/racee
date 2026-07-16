import { checkRequiredEnvVars } from "@/lib/health/env";
import { checkSupabaseStorage } from "@/lib/health/storage";
import { checkPostgres } from "@/lib/health/postgres";

export async function GET(request: Request) {
  const token = request.headers.get("x-health-check-token");
  if (!token || token !== process.env.HEALTH_CHECK_TOKEN) {
    return new Response(null, { status: 401 });
  }

  const envVars = checkRequiredEnvVars();
  const [storage, postgres] = await Promise.all([
    checkSupabaseStorage(),
    checkPostgres(),
  ]);

  const ok = envVars.ok && storage.ok && postgres.ok;

  const body = JSON.stringify({
    status: ok ? "ok" : "error",
    checks: { envVars, supabaseStorage: storage, postgres },
  });

  return new Response(body, {
    status: ok ? 200 : 503,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}
