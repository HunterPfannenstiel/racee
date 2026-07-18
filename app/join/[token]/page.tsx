import { redirect } from "next/navigation";
import { call, ORPCError } from "@orpc/server";
import { getSession } from "@/server/auth/server";
import { leaguesRouter } from "@/server/rpc/routers/leagues";

export default async function JoinPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const session = await getSession();

  if (!session) {
    redirect(`/signin?next=/join/${token}`);
  }

  try {
    // Invoke the `leagues.join` procedure's handler directly (no HTTP
    // round trip) so this page and the oRPC route share exactly one call
    // path for the join-via-invite business logic.
    await call(leaguesRouter.join, { token });
  } catch (err) {
    if (!(err instanceof ORPCError) || err.code !== "NOT_FOUND") throw err;
  }

  redirect("/");
}
