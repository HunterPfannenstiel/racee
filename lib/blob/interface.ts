export interface BlobStore {
  read<T>(pathname: string): Promise<T | null>;
  write(pathname: string, data: unknown): Promise<void>;
  delete(pathname: string): Promise<void>;
  wipe(): Promise<void>;
  writeBinary(pathname: string, data: Uint8Array, contentType: string): Promise<void>;
  readBinary(pathname: string): Promise<{ data: Uint8Array; contentType: string } | null>;
}
