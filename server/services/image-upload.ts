import { MAX_AVATAR_UPLOAD_BYTES } from "@/lib/avatar";
import { InvariantViolationError } from "@/server/domain/errors";

export type UploadedImage = { data: Uint8Array; contentType: string };

const ALLOWED = ["image/jpeg", "image/png", "image/webp"] as const;

/** Checks the file's first bytes so a renamed non-image can't be stored as a picture. */
function looksLike(contentType: string, b: Uint8Array): boolean {
  if (contentType === "image/jpeg") return b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
  if (contentType === "image/png") return b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47;
  if (contentType === "image/webp") {
    const tag = (i: number) => String.fromCharCode(b[i], b[i + 1], b[i + 2], b[i + 3]);
    return tag(0) === "RIFF" && tag(8) === "WEBP";
  }
  return false;
}

/**
 * Turns an uploaded image data URL into bytes, rejecting anything that isn't a
 * small JPEG, PNG or WebP. Shared by profile-picture and team-logo uploads.
 */
export function parseImageDataUrl(dataUrl: string): UploadedImage {
  const match = /^data:([a-z/]+);base64,(.+)$/.exec(dataUrl);
  const contentType = match?.[1];
  if (!match || !contentType || !(ALLOWED as readonly string[]).includes(contentType)) {
    throw new InvariantViolationError("Pictures must be a JPEG, PNG or WebP image");
  }
  const data = new Uint8Array(Buffer.from(match[2], "base64"));
  if (data.length === 0 || data.length > MAX_AVATAR_UPLOAD_BYTES) {
    throw new InvariantViolationError("That picture is too large — try a smaller one");
  }
  if (!looksLike(contentType, data)) {
    throw new InvariantViolationError("That file isn't a valid image");
  }
  return { data, contentType };
}
