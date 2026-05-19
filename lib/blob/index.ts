import type { BlobStore } from "./interface";
import { LocalBlobStore } from "./local";
import { SupabaseBlobStore } from "./supabase";

export const blob: BlobStore =
  process.env.USE_LOCAL_BLOB === "true"
    ? new LocalBlobStore()
    : new SupabaseBlobStore();
