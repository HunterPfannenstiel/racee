import type { BlobStore } from "./interface";
import { LocalBlobStore } from "./local";
import { VercelBlobStore } from "./vercel";

export const blob: BlobStore =
  process.env.USE_LOCAL_BLOB === "true"
    ? new LocalBlobStore()
    : new VercelBlobStore();
