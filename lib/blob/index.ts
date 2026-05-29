import type { BlobStore } from "./interface.ts";
import { LocalBlobStore } from "./local.ts";
import { SupabaseBlobStore } from "./supabase.ts";

export const blob: BlobStore =
  process.env.USE_LOCAL_BLOB === "true"
    ? new LocalBlobStore()
    : new SupabaseBlobStore();
