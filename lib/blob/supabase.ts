import { createClient } from "@supabase/supabase-js";
import type { BlobStore } from "./interface.ts";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

const BUCKET = process.env.BUCKET_NAME!;

export class SupabaseBlobStore implements BlobStore {
  async read<T>(pathname: string): Promise<T | null> {
    const { data, error } = await supabase.storage.from(BUCKET).download(pathname);
    if (error) return null;
    return JSON.parse(await data.text()) as T;
  }

  async write(pathname: string, data: unknown): Promise<void> {
    await supabase.storage.from(BUCKET).upload(pathname, JSON.stringify(data), {
      upsert: true,
      contentType: "application/json",
    });
  }

  async delete(pathname: string): Promise<void> {
    await supabase.storage.from(BUCKET).remove([pathname]);
  }

  async wipe(): Promise<void> {
    await this.wipeFolder("");
  }

  private async wipeFolder(folder: string): Promise<void> {
    const { data } = await supabase.storage.from(BUCKET).list(folder);
    if (!data) return;
    const prefix = folder ? `${folder}/` : "";
    const files = data.filter((i) => i.id !== null).map((i) => `${prefix}${i.name}`);
    const folders = data.filter((i) => i.id === null).map((i) => `${prefix}${i.name}`);
    if (files.length > 0) await supabase.storage.from(BUCKET).remove(files);
    for (const sub of folders) await this.wipeFolder(sub);
  }
}
