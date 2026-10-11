export type AvatarImage = { data: Uint8Array; contentType: string };

/** Uploaded profile photos — one per user, overwritten on each upload. */
export interface IAvatarImageRepository {
  find(userId: string): Promise<AvatarImage | null>;
  save(userId: string, image: AvatarImage): Promise<void>;
}
