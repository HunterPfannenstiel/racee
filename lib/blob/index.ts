import type { BlobStore } from "./interface.ts";
import { LocalBlobStore } from "./local.ts";
import { SupabaseBlobStore } from "./supabase.ts";

export const blob: BlobStore = process.env.VERCEL
  ? new SupabaseBlobStore()
  : new LocalBlobStore();
