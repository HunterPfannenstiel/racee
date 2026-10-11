export type UploadUserAvatarPayload = {
  userId: string;
  /** The image as a data URL (the client shrinks and crops it to a small square first). */
  dataUrl: string;
};

export interface IUploadUserAvatarCommand {
  execute(payload: UploadUserAvatarPayload): Promise<{ image: string }>;
}
