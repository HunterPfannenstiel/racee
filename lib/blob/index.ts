import type { BlobStore } from "./interface.ts";
import { LocalBlobStore } from "./local.ts";
import { SupabaseBlobStore } from "./supabase.ts";
import { usingSupabaseBlobStore } from "./backend.ts";

export { usingSupabaseBlobStore };

export const blob: BlobStore = usingSupabaseBlobStore()
  ? new SupabaseBlobStore()
  : new LocalBlobStore();
