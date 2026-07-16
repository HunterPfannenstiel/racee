import { createClient } from "@supabase/supabase-js";
import { withTimeout } from "@/lib/health/timeout";

const TIMEOUT_MS = 5000;

export async function checkSupabaseStorage(): Promise<{ ok: boolean; detail?: string }> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  const bucket = process.env.BUCKET_NAME;

  if (!url || !key || !bucket) {
    return { ok: false, detail: "skipped: missing required env var(s)" };
  }

  const supabase = createClient(url, key);

  try {
    const { error } = await withTimeout(
      supabase.storage.from(bucket).list("", { limit: 1 }),
      TIMEOUT_MS
    );
    if (error) return { ok: false, detail: error.message };
    return { ok: true };
  } catch (err) {
    return { ok: false, detail: err instanceof Error ? err.message : "unknown error" };
  }
}
