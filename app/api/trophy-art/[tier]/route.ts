import { getSession } from "@/server/auth/server";
import { TrophyTierSchema } from "@/server/domain/trophy-art";
import { BlobTrophyArtRepository } from "@/server/repositories/trophy-art/BlobTrophyArtRepository";
import { BlobTrophyArtImageQuery } from "@/server/queries/trophy-art-image/BlobTrophyArtImageQuery";

const imageQuery = new BlobTrophyArtImageQuery(new BlobTrophyArtRepository());

/**
 * Serves the admin's custom trophy picture for a tier. Plain route because an
 * <img> can't call oRPC; the `?v=` version changes on every upload.
 */
export async function GET(_request: Request, ctx: { params: Promise<{ tier: string }> }) {
  const session = await getSession();
  if (!session) return new Response(null, { status: 401 });

  const tier = TrophyTierSchema.safeParse((await ctx.params).tier);
  if (!tier.success) return new Response(null, { status: 404 });
  const image = await imageQuery.execute(tier.data);
  if (!image) return new Response(null, { status: 404 });

  return new Response(new Blob([image.data as BlobPart], { type: image.contentType }), {
    headers: {
      "Content-Type": image.contentType,
      "Cache-Control": "private, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
