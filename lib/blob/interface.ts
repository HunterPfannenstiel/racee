export interface BlobStore {
  read<T>(pathname: string): Promise<T | null>;
  write(pathname: string, data: unknown): Promise<void>;
  delete(pathname: string): Promise<void>;
  wipe(): Promise<void>;
}
