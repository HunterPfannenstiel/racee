import { redirect } from "next/navigation";
import Link from "next/link";
import { CalendarIcon } from "lucide-react";
import { PageShell } from "@/components/ui/page-shell";
import { getSession } from "@/server/auth/server";
import { BlobLeagueRepository } from "@/server/repositories/blob/BlobLeagueRepository";
import { BlobTeamRepository } from "@/server/repositories/blob/BlobTeamRepository";
import { PrismaUserRepository } from "@/server/repositories/prisma/PrismaUserRepository";
import { LeagueService } from "@/server/services/LeagueService";

const svc = new LeagueService(new BlobLeagueRepository(), new BlobTeamRepository(), new PrismaUserRepository());

export default async function CommissionerPage() {
  const session = await getSession();
  if (!session) redirect("/");
  const leagues = await svc.listLeaguesByCommissioner(session.user.id);

  return (
    <PageShell title="Commissioner">
      {leagues.length === 0 ? (
        <p className="text-sm text-muted-foreground">You haven't created any leagues.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {leagues.map((league) => (
            <Link
              key={league.leagueId}
              href={`/commissioner/leagues/${league.leagueId}`}
              className="group flex flex-col gap-3 rounded-sm border border-border bg-card p-5 transition-colors hover:border-primary"
            >
              <div className="flex items-center gap-3">
                <CalendarIcon className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
                <span className="text-sm font-semibold tracking-tight">{league.name}</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">Manage league settings and props.</p>
            </Link>
          ))}
        </div>
      )}
    </PageShell>
  );
}
