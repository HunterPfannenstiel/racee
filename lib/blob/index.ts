import type { BlobStore } from "./interface.ts";
import { SupabaseBlobStore } from "./supabase.ts";

export const blob: BlobStore = new SupabaseBlobStore();
