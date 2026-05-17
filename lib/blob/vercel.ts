import { put, list, get, del } from "@vercel/blob";
import type { BlobStore } from "./interface";

export class VercelBlobStore implements BlobStore {
  private async readUrl<T>(url: string): Promise<T> {
    const res = await get(url, { access: "private", useCache: false });
    if (!res) throw new Error(`Blob not found: ${url}`);
    return new Response(res.stream).json() as Promise<T>;
  }

  async read<T>(pathname: string): Promise<T | null> {
    const { blobs } = await list({ prefix: pathname, limit: 1 });
    if (blobs.length === 0) return null;
    return this.readUrl<T>(blobs[0].url);
  }

  async write(pathname: string, data: unknown): Promise<void> {
    const { blobs } = await list({ prefix: pathname });
    if (blobs.length > 0) await del(blobs.map((b) => b.url));
    await put(pathname, JSON.stringify(data), {
      access: "private",
      addRandomSuffix: false,
      contentType: "application/json",
    });
  }

  async delete(pathname: string): Promise<void> {
    const { blobs } = await list({ prefix: pathname });
    if (blobs.length > 0) await del(blobs.map((b) => b.url));
  }

  async wipe(): Promise<void> {
    let cursor: string | undefined;
    do {
      const { blobs, cursor: next } = await list({ cursor, limit: 1000 });
      if (blobs.length > 0) await del(blobs.map((b) => b.url));
      cursor = next;
    } while (cursor);
  }
}
