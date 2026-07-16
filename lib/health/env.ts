const REQUIRED_ENV_VARS = [
  "SUPABASE_URL",
  "SUPABASE_SECRET_KEY",
  "BUCKET_NAME",
  "DATABASE_URL",
] as const;

export function checkRequiredEnvVars(): { ok: boolean; missing: string[] } {
  const missing = REQUIRED_ENV_VARS.filter((name) => !process.env[name]?.trim());
  return { ok: missing.length === 0, missing };
}
