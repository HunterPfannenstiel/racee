export type SetPhotoUploadsBlockedPayload = { userId: string; blocked: boolean };

export interface ISetPhotoUploadsBlockedCommand {
  execute(payload: SetPhotoUploadsBlockedPayload): Promise<void>;
}
