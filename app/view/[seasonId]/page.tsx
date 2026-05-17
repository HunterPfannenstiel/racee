"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { type Race, type SeasonStandings, type User, type Team } from "@/lib/schemas";
import { computeSeasonStandings, computeTeamSeasonStandings } from "@/lib/scoring";
import { Card } from "@/components/ui/card";

type InitData = {
  races: Race[];
  standings: SeasonStandings | null;
  usersById: Record<string, User>;
  teams: Team[];
};

const MEDALS = ["🥇", "🥈", "🥉"];

export default function ViewSeasonPage() {
  const { seasonId } = useParams<{ seasonId: string }>();
  const [data, setData] = useState<InitData | null>(null);

  useEffect(() => {
    fetch(`/api/view/${seasonId}/init`)
      .then((r) => r.json())
      .then(setData);
  }, [seasonId]);

  if (!data) {
    return (
      <main className="max-w-lg mx-auto px-6 py-10">
        <div className="flex items-center gap-3 text-muted-foreground">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-xs tracking-widest uppercase">Loading</span>
        </div>
      </main>
    );
  }

  const gradedRaceIds = new Set(data.standings?.gradedRaceIds ?? []);
  const pending = data.races.filter((r) => !gradedRaceIds.has(r.id));

  const individualStandings = data.standings
    ? computeSeasonStandings(data.standings.individual)
    : [];
  const teamStandings = data.standings
    ? computeTeamSeasonStandings(data.standings.teams)
    : [];

  const teamsById = Object.fromEntries(data.teams.map((t) => [t.id, t]));

  return (
    <main className="max-w-lg mx-auto px-6 py-10 space-y-12">
      <section className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Drivers</p>
        {individualStandings.length === 0 ? (
          <p className="text-xs tracking-widest uppercase text-muted-foreground">No scores yet.</p>
        ) : (
          <div className="space-y-2">
            {individualStandings.map(({ userId, total, mulliganed }, idx) => (
              <Card key={userId} size="sm" className="flex flex-row items-center gap-4 px-4 py-3">
                <span className="w-8 text-sm font-mono text-muted-foreground">
                  {idx < 3 ? MEDALS[idx] : `${idx + 1}.`}
                </span>
                <span className="flex-1 text-sm font-medium">
                  {data.usersById[userId]?.name ?? userId}
                </span>
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
                <Card key={teamId} size="sm" className="flex flex-row items-center gap-4 px-4 py-3">
                  <span className="w-8 text-sm font-mono text-muted-foreground">
                    {idx < 3 ? MEDALS[idx] : `${idx + 1}.`}
                  </span>
                  <span className="flex-1 text-sm font-medium">
                    {teamsById[teamId]?.name ?? teamId}
                  </span>
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

      {pending.length > 0 && (
        <section className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Pending</p>
          <div className="flex flex-wrap gap-2">
            {pending.map((race) => (
              <Card key={race.id} size="sm" className="px-4 py-2">
                <p className="text-sm font-medium">{race.title}</p>
                <p className="text-xs text-muted-foreground">{race.date}</p>
              </Card>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
