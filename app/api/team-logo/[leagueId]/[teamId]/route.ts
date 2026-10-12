import { getSession } from "@/server/auth/server";
import { BlobTeamLogoRepository } from "@/server/repositories/team-logo/BlobTeamLogoRepository";
import { BlobTeamLogoQuery } from "@/server/queries/team-logo/BlobTeamLogoQuery";

const teamLogoQuery = new BlobTeamLogoQuery(new BlobTeamLogoRepository());

/**
 * Serves a team's uploaded logo to signed-in users. Plain route because an
 * <img> tag can't call oRPC; the `?v=` version changes on every upload, which
 * keeps the long cache below correct.
 */
export async function GET(_request: Request, ctx: { params: Promise<{ leagueId: string; teamId: string }> }) {
  const session = await getSession();
  if (!session) return new Response(null, { status: 401 });

  const { leagueId, teamId } = await ctx.params;
  const image = await teamLogoQuery.execute(leagueId, teamId);
  if (!image) return new Response(null, { status: 404 });

  return new Response(new Blob([image.data as BlobPart], { type: image.contentType }), {
    headers: {
      "Content-Type": image.contentType,
      "Cache-Control": "private, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
