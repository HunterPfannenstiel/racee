// Leaf module with no further imports — safe to import statically even before
// env vars are loaded (e.g. from datafix-shared.ts, which is imported at the
// top of every datafix script before loadDatafixEnv() runs). A function, not a
// cached const, so each call reads the current process.env instead of freezing
// in whatever value existed at first import.
export function usingSupabaseBlobStore(): boolean {
  return Boolean(process.env.SUPABASE_URL);
}
