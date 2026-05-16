import { put, list, get, del } from "@vercel/blob";

export async function readBlob(pathname: string) {
  const { blobs } = await list({ prefix: pathname, limit: 1 });
  if (blobs.length === 0) return null;
  // useCache: false ensures we always read the latest version from origin
  return get(blobs[0].url, { access: "private", useCache: false });
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
