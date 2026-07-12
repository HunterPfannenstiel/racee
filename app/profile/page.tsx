"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Check, X } from "lucide-react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc/client";
import { signOut, refreshSession } from "@/server/auth/auth-client";
import { PageShell } from "@/components/ui/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { RequireUser } from "@/components/RequireUser";
import { OverhaulNotice } from "@/components/ui/overhaul-notice";

export default function ProfilePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");

  const meQuery = useQuery(orpc.me.get.queryOptions());
  const user = meQuery.data;

  const updateNameMutation = useMutation(
    orpc.me.updateName.mutationOptions({
      onSuccess: () => {
        // Keep the oRPC-backed query and the better-auth session (used
        // elsewhere via UserContext) both showing the new name.
        queryClient.invalidateQueries({ queryKey: orpc.me.get.key() });
        refreshSession();
        setEditing(false);
      },
    }),
  );

  function startEdit() {
    setName(user?.name ?? "");
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
  }

  function handleSave() {
    updateNameMutation.mutate({ name });
  }

  const initial = user?.name?.[0]?.toUpperCase() ?? "?";

  return (
    <PageShell title="Profile">
      <OverhaulNotice />
      <RequireUser>
        <div className="space-y-4">

          <Card>
            <CardHeader>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Account</h2>
            </CardHeader>
            <CardContent>
              {meQuery.isPending ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Spinner />
                  Loading...
                </div>
              ) : meQuery.isError ? (
                <p className="text-sm text-destructive">
                  {meQuery.error instanceof Error ? meQuery.error.message : "Failed to load profile."}
                </p>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <div className="size-9 rounded-full bg-muted flex items-center justify-center text-sm font-semibold text-muted-foreground shrink-0 select-none">
                      {initial}
                    </div>
                    {editing ? (
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        <Input
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          maxLength={30}
                          disabled={updateNameMutation.isPending}
                          autoFocus
                          className="h-7 text-sm"
                        />
                        <Button size="icon" variant="ghost" className="size-7 shrink-0" onClick={handleSave} disabled={updateNameMutation.isPending || name.trim().length === 0}>
                          {updateNameMutation.isPending ? <Spinner /> : <Check className="size-3.5" />}
                        </Button>
                        <Button size="icon" variant="ghost" className="size-7 shrink-0" onClick={cancelEdit} disabled={updateNameMutation.isPending}>
                          <X className="size-3.5" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="text-sm font-medium truncate">{user?.name}</span>
                        <button onClick={startEdit} className="text-muted-foreground hover:text-foreground transition-colors shrink-0 ml-auto" aria-label="Edit name">
                          <Pencil className="size-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                  {updateNameMutation.isError && (
                    <p className="mt-2 text-xs text-destructive">
                      {updateNameMutation.error instanceof Error ? updateNameMutation.error.message : "Something went wrong. Try again."}
                    </p>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {user && user.leagues.length > 0 && (
            <Card>
              <CardHeader>
                <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Leagues</h2>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {user.leagues.map((l) => (
                    <li key={l.id}>
                      <p className="text-sm font-medium">{l.name}</p>
                      <p className="text-xs text-muted-foreground">{l.commissionerId === user.id ? "Commissioner" : "Member"}</p>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {user && user.leagues.some((l) => l.commissionerId === user.id) && (
            <Button variant="outline" className="w-full" asChild>
              <Link href="/commissioner">Manage Leagues</Link>
            </Button>
          )}

          <Button
            variant="ghost"
            className="text-muted-foreground w-full"
            onClick={() => { signOut(); router.push("/"); }}
          >
            Sign out
          </Button>

        </div>
      </RequireUser>
    </PageShell>
  );
}
