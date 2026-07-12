"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { CalendarIcon, ChevronLeft } from "lucide-react";
import { PageShell } from "@/components/ui/page-shell";
import { RequireUser } from "@/components/RequireUser";
import { QueryLoading, QueryError } from "@/components/ui/query-state";
import { useUser } from "@/app/context/UserContext";
import { orpc } from "@/lib/orpc/client";

export default function CommissionerPage() {
  const { user } = useUser();
  const leaguesQuery = useQuery(
    orpc.leagues.listManaged.queryOptions({ enabled: !!user }),
  );
  const leagues = leaguesQuery.data ?? [];

  return (
    <PageShell title="Commissioner">
      <RequireUser>
        <Link href="/profile" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors w-fit">
          <ChevronLeft className="size-3.5" />
          Profile
        </Link>
        {leaguesQuery.isPending ? (
          <QueryLoading />
        ) : leaguesQuery.isError ? (
          <QueryError error={leaguesQuery.error} onRetry={() => leaguesQuery.refetch()} />
        ) : leagues.length === 0 ? (
          <p className="text-sm text-muted-foreground">You haven&apos;t created any leagues.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {leagues.map((league) => (
              <Link
                key={league.id}
                href={`/commissioner/leagues/${league.id}`}
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
      </RequireUser>
    </PageShell>
  );
}
