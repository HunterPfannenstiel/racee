"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc/client";
import { PHOTO_STRIKE_LIMIT } from "@/lib/moderation";
import { PageShell } from "@/components/ui/page-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { QueryError, QueryLoading } from "@/components/ui/query-state";
import { PlayerAvatar } from "@/components/avatar/PlayerAvatar";
import { TeamLogo } from "@/components/avatar/TeamLogo";

/** Admin review queue: reported profile photos and team logos, plus accounts with photo strikes. */
export default function AdminReportsPage() {
  const queryClient = useQueryClient();
  const reportsQuery = useQuery(orpc.moderation.reports.queryOptions());
  const refresh = () => queryClient.invalidateQueries({ queryKey: orpc.moderation.reports.key() });
  const resolve = useMutation(orpc.moderation.resolve.mutationOptions({ onSuccess: refresh }));
  const setBlocked = useMutation(orpc.moderation.setUploadsBlocked.mutationOptions({ onSuccess: refresh }));

  return (
    <PageShell title="Reported">
      <Link href="/admin" className="text-xs text-muted-foreground transition-colors hover:text-foreground">
        ← Admin
      </Link>
      {reportsQuery.isPending ? (
        <QueryLoading />
      ) : reportsQuery.isError ? (
        <QueryError error={reportsQuery.error} onRetry={() => reportsQuery.refetch()} />
      ) : (
        <div className="space-y-6">
          <section className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Reported photos</h2>
            {reportsQuery.data.open.length === 0 && <p className="text-sm text-muted-foreground">Nothing reported. All clear.</p>}
            {reportsQuery.data.open.map((r) => {
              const key = `${r.target.kind}:${r.target.kind === "avatar" ? r.target.userId : r.target.teamId}:${r.imageVersion}`;
              const pending = resolve.isPending && resolve.variables?.imageVersion === r.imageVersion;
              return (
                <Card key={key}>
                  <CardContent className="flex flex-col gap-4 pt-4 sm:flex-row sm:items-start">
                    <div className="shrink-0 self-center">
                      {r.target.kind === "avatar" ? (
                        <PlayerAvatar userId={r.target.userId} name={r.ownerName} image={r.imageVersion} size="2xl" />
                      ) : (
                        <TeamLogo leagueId={r.target.leagueId} teamId={r.target.teamId} name={r.ownerName} logo={r.imageVersion} size="2xl" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="font-semibold">
                        {r.ownerName}
                        <span className="ml-2 text-xs font-normal text-muted-foreground">
                          {r.target.kind === "avatar" ? "Profile photo" : `Team logo${r.leagueName ? ` · ${r.leagueName}` : ""}`}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Reported {r.reportCount} {r.reportCount === 1 ? "time" : "times"} by {r.reporterNames.join(", ")} · first{" "}
                        {new Date(r.firstReportedAt).toLocaleString()}
                      </p>
                      {r.reasons.length > 0 && (
                        <ul className="list-disc pl-4 text-sm">
                          {r.reasons.map((reason, i) => (
                            <li key={i}>{reason}</li>
                          ))}
                        </ul>
                      )}
                      {!r.stillCurrent && (
                        <p className="text-xs text-amber-500">They&apos;ve already changed this picture. Dismiss to clear the report.</p>
                      )}
                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={pending || !r.stillCurrent}
                          onClick={() => resolve.mutate({ target: r.target, imageVersion: r.imageVersion, action: "remove" })}
                        >
                          {pending && resolve.variables?.action === "remove" && <Spinner className="mr-1 size-3" />}
                          Remove photo
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={pending}
                          onClick={() => resolve.mutate({ target: r.target, imageVersion: r.imageVersion, action: "dismiss" })}
                        >
                          Keep it
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            <p className="text-[11px] text-muted-foreground">
              Removing a photo resets it to initials, notifies the person who uploaded it, and gives them a strike. At{" "}
              {PHOTO_STRIKE_LIMIT} strikes their photo uploads turn off (built-in icons still work).
            </p>
          </section>

          <Card>
            <CardHeader>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Photo strikes</h2>
            </CardHeader>
            <CardContent className="space-y-2">
              {reportsQuery.data.moderatedUsers.length === 0 && <p className="text-sm text-muted-foreground">No strikes yet.</p>}
              {reportsQuery.data.moderatedUsers.map((u) => (
                <div key={u.userId} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm">{u.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {u.strikes} of {PHOTO_STRIKE_LIMIT} strikes{u.uploadsBlocked ? " · uploads turned off" : ""}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant={u.uploadsBlocked ? "outline" : "ghost"}
                    disabled={setBlocked.isPending}
                    onClick={() => setBlocked.mutate({ userId: u.userId, blocked: !u.uploadsBlocked })}
                  >
                    {u.uploadsBlocked ? "Turn uploads back on" : "Turn off uploads"}
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </PageShell>
  );
}
