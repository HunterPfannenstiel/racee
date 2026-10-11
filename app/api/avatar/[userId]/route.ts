import { getSession } from "@/server/auth/server";
import { BlobAvatarImageRepository } from "@/server/repositories/avatar-image/BlobAvatarImageRepository";
import { BlobAvatarImageQuery } from "@/server/queries/avatar-image/BlobAvatarImageQuery";

const avatarImageQuery = new BlobAvatarImageQuery(new BlobAvatarImageRepository());

/**
 * Serves a user's uploaded profile photo to signed-in users. An <img> tag can't
 * call oRPC, so this is a plain route; the `?v=` version in the URL changes on
 * every upload, which is what lets the long cache below stay correct.
 */
export async function GET(_request: Request, ctx: { params: Promise<{ userId: string }> }) {
  const session = await getSession();
  if (!session) return new Response(null, { status: 401 });

  const { userId } = await ctx.params;
  const image = await avatarImageQuery.execute(userId);
  if (!image) return new Response(null, { status: 404 });

  return new Response(new Blob([image.data as BlobPart], { type: image.contentType }), {
    headers: {
      "Content-Type": image.contentType,
      "Cache-Control": "private, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
