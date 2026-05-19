"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { type League, type LeagueStandings, type User, type Team } from "@/lib/schemas";
import { computeSeasonStandings, computeTeamSeasonStandings } from "@/lib/scoring";
import { Card } from "@/components/ui/card";
import { PageShell } from "@/components/ui/page-shell";
import { LeaguePicker } from "@/components/ui/league-picker";

type LeagueData = {
  league: League | null;
  standings: LeagueStandings | null;
  usersById: Record<string, User>;
  teams: Team[];
};

const MEDALS = ["🥇", "🥈", "🥉"];

export default function ViewPage() {
  const [leagues, setLeagues] = useState<League[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [data, setData] = useState<LeagueData | null>(null);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    fetch("/api/leagues")
      .then((r) => r.json())
      .then((s: League[]) => {
        setLeagues(s);
        if (s.length > 0) setSelectedId(s[0].id);
      });
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    setLoadingData(true);
    setData(null);
    fetch(`/api/view/${selectedId}/init`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoadingData(false);
      });
  }, [selectedId]);

  const mulliganCount = data?.league?.mulliganCount ?? 0;
  const individualStandings = data?.standings ? computeSeasonStandings(data.standings.individual, mulliganCount) : [];
  const teamStandings = data?.standings ? computeTeamSeasonStandings(data.standings.teams, mulliganCount) : [];
  const teamsById = Object.fromEntries((data?.teams ?? []).map((t) => [t.id, t]));
  const userTeamColor = Object.fromEntries(
    (data?.teams ?? []).flatMap((t) => t.memberIds.map((uid) => [uid, t.color ?? "#6b7280"]))
  );

  return (
    <PageShell title="Standings">
      {!leagues ? (
        <div className="flex items-center gap-3 text-muted-foreground">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-xs tracking-widest uppercase">Loading</span>
        </div>
      ) : leagues.length === 0 ? (
        <p className="text-xs tracking-widest uppercase text-muted-foreground">No leagues yet.</p>
      ) : (
        <div className="space-y-6">
          <LeaguePicker leagues={leagues} selectedLeagueId={selectedId} onSelect={setSelectedId} />

          {loadingData ? (
            <div className="flex items-center gap-3 text-muted-foreground">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-xs tracking-widest uppercase">Loading</span>
            </div>
          ) : data && (
            <>
              <section className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Drivers</p>
                {individualStandings.length === 0 ? (
                  <p className="text-xs tracking-widest uppercase text-muted-foreground">No scores yet.</p>
                ) : (
                  <div className="space-y-2">
                    {individualStandings.map(({ userId, total, mulliganed }, idx) => (
                      <Card key={userId} size="sm" className="relative flex flex-row items-center gap-4 px-4 py-3">
                        <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-sm" style={{ backgroundColor: userTeamColor[userId] ?? "#6b7280" }} />
                        <span className="w-8 text-sm font-mono text-muted-foreground">
                          {idx < 3 ? MEDALS[idx] : `${idx + 1}.`}
                        </span>
                        <Link href={`/profile/${userId}`} className="flex-1 text-sm font-medium hover:text-primary transition-colors">{data.usersById[userId]?.name ?? userId}</Link>
                        <span className="text-sm font-mono tabular-nums">{total} pts</span>
                        {mulliganed > 0 && (
                          <span className="text-xs text-muted-foreground tabular-nums">
                            -{mulliganed} race{mulliganed > 1 ? "s" : ""}
                          </span>
                        )}
                      </Card>
                    ))}
                  </div>
                )}
              </section>

              {data.teams.length > 0 && (
                <section className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Constructors</p>
                  {teamStandings.length === 0 ? (
                    <p className="text-xs tracking-widest uppercase text-muted-foreground">No scores yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {teamStandings.map(({ teamId, total, mulliganed }, idx) => (
                        <Card key={teamId} size="sm" className="relative flex flex-row items-center gap-4 px-4 py-3">
                          <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-sm" style={{ backgroundColor: teamsById[teamId]?.color ?? "#6b7280" }} />
                          <span className="w-8 text-sm font-mono text-muted-foreground">
                            {idx < 3 ? MEDALS[idx] : `${idx + 1}.`}
                          </span>
                          <span className="flex-1 text-sm font-medium">{teamsById[teamId]?.name ?? teamId}</span>
                          <span className="text-sm font-mono tabular-nums">{total} pts</span>
                          {mulliganed > 0 && (
                            <span className="text-xs text-muted-foreground tabular-nums">
                              -{mulliganed} race{mulliganed > 1 ? "s" : ""}
                            </span>
                          )}
                        </Card>
                      ))}
                    </div>
                  )}
                </section>
              )}
            </>
          )}
        </div>
      )}
    </PageShell>
  );
}
