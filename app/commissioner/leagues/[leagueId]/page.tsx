import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft, Settings2, Users } from "lucide-react";
import { PageShell } from "@/components/ui/page-shell";
import { requireCommissioner } from "@/server/auth/guards";
import { BlobTeamRepository } from "@/server/repositories/blob/BlobTeamRepository";
import { PrismaUserRepository } from "@/server/repositories/prisma/PrismaUserRepository";
import { BlobCommissionerTeamsQuery } from "@/server/queries/commissioner-teams/BlobCommissionerTeamsQuery";

const CARDS = [
  {
    slug: "settings",
    icon: Settings2,
    title: "Settings",
    description: "Scoring, props, and league name.",
  },
  {
    slug: "teams",
    icon: Users,
    title: "Teams",
    description: "Create teams and assign players.",
  },
];

export default async function CommissionerLeagueHubPage({
  params,
}: {
  params: Promise<{ leagueId: string }>;
}) {
  const { leagueId } = await params;

  let league: Awaited<ReturnType<typeof requireCommissioner>>["league"];
  try {
    ({ league } = await requireCommissioner(leagueId));
  } catch {
    redirect("/commissioner");
  }

  const query = new BlobCommissionerTeamsQuery(
    new BlobTeamRepository(),
    new PrismaUserRepository(),
  );
  const { teams, users } = await query.execute(leagueId);

  const assignedIds = new Set(teams.flatMap((t) => t.memberIds));
  const playerCount = assignedIds.size;
  const teamCount = teams.length;
  const unassignedCount = users.filter((u) => !assignedIds.has(u.id)).length;

  return (
    <PageShell title={league.name}>
      <Link
        href="/commissioner"
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors w-fit"
      >
        <ChevronLeft className="size-3.5" />
        Commissioner
      </Link>

      <p className="text-xs text-muted-foreground">
        {playerCount} {playerCount === 1 ? "player" : "players"} · {teamCount}{" "}
        {teamCount === 1 ? "team" : "teams"}
        {unassignedCount > 0 && ` · ${unassignedCount} unassigned`}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {CARDS.map(({ slug, icon: Icon, title, description }) => (
          <Link
            key={slug}
            href={`/commissioner/leagues/${leagueId}/${slug}`}
            className="group flex flex-col gap-3 rounded-sm border border-border bg-card p-5 transition-colors hover:border-primary"
          >
            <div className="flex items-center gap-3">
              <Icon className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
              <span className="text-sm font-semibold tracking-tight">{title}</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
          </Link>
        ))}
      </div>
    </PageShell>
  );
}
