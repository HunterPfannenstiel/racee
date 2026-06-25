import { redirect } from "next/navigation";
import { getSession } from "@/server/auth/server";
import { BlobLeagueRepository } from "@/server/repositories/blob/BlobLeagueRepository";
import { BlobTeamRepository } from "@/server/repositories/blob/BlobTeamRepository";
import { PrismaUserRepository } from "@/server/repositories/prisma/PrismaUserRepository";
import { LeagueService } from "@/server/services/LeagueService";
import { NotFoundError } from "@/server/domain/errors";

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

  const svc = new LeagueService(
    new BlobLeagueRepository(),
    new BlobTeamRepository(),
    new PrismaUserRepository(),
  );

  try {
    await svc.joinViaInvite(token, session.user.id);
  } catch (e) {
    if (!(e instanceof NotFoundError)) throw e;
  }

  redirect("/");
}
