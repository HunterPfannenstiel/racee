import { put, list, get, del } from "@vercel/blob";

export async function readBlobUrl<T = unknown>(url: string): Promise<T> {
  const res = await get(url, { access: "private", useCache: false });
  return new Response(res.stream).json() as Promise<T>;
}

export async function readBlob<T = unknown>(pathname: string): Promise<T | null> {
  const { blobs } = await list({ prefix: pathname, limit: 1 });
  if (blobs.length === 0) return null;
  return readBlobUrl<T>(blobs[0].url);
}

export async function deleteBlob(pathname: string) {
  const { blobs } = await list({ prefix: pathname });
  if (blobs.length > 0) await del(blobs.map((b) => b.url));
}

export async function overwriteBlob(pathname: string, data: unknown) {
  const { blobs } = await list({ prefix: pathname });
  if (blobs.length > 0) await del(blobs.map((b) => b.url));
  return put(pathname, JSON.stringify(data), {
    access: "private",
    addRandomSuffix: false,
    contentType: "application/json",
  });
}
