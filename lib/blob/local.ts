import fs from "fs";
import path from "path";
import type { BlobStore } from "./interface";

export class LocalBlobStore implements BlobStore {
  private base = path.join(process.cwd(), ".blob-store");

  private fullPath(pathname: string) {
    return path.join(this.base, pathname);
  }

  async read<T>(pathname: string): Promise<T | null> {
    try {
      const raw = fs.readFileSync(this.fullPath(pathname), "utf-8");
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  async write(pathname: string, data: unknown): Promise<void> {
    const full = this.fullPath(pathname);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, JSON.stringify(data, null, 2));
  }

  async delete(pathname: string): Promise<void> {
    try {
      fs.rmSync(this.fullPath(pathname), { force: true });
    } catch {
      // file didn't exist
    }
  }

  async wipe(): Promise<void> {
    await fs.promises.rm(this.base, { recursive: true, force: true });
  }
}
