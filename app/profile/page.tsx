"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Check, X } from "lucide-react";
import Link from "next/link";
import { useUser } from "@/app/context/UserContext";
import { signOut } from "@/server/auth/auth-client";
import { PageShell } from "@/components/ui/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { RequireUser } from "@/components/RequireUser";

type LeagueMembership = {
  id: string;
  name: string;
  commissionerId: string;
};

export default function ProfilePage() {
  const { user, updateName } = useUser();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [leagues, setLeagues] = useState<LeagueMembership[]>([]);

  useEffect(() => {
    if (!user) return;
    fetch("/api/leagues")
      .then((r) => r.json())
      .then((data: LeagueMembership[]) => setLeagues(data))
      .catch(() => {});
  }, [user]);

  function startEdit() {
    setName(user?.name ?? "");
    setEditing(true);
    setError(null);
  }

  function cancelEdit() {
    setEditing(false);
    setError(null);
  }

  async function handleSave() {
    setLoading(true);
    setError(null);
    try {
      await updateName(name);
      setEditing(false);
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  const initial = user?.name?.[0]?.toUpperCase() ?? "?";

  return (
    <PageShell title="Profile">
      <RequireUser>
        <div className="space-y-4">

          <Card>
            <CardHeader>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Account</h2>
            </CardHeader>
            <CardContent>
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
                      disabled={loading}
                      autoFocus
                      className="h-7 text-sm"
                    />
                    <Button size="icon" variant="ghost" className="size-7 shrink-0" onClick={handleSave} disabled={loading || name.trim().length === 0}>
                      {loading ? <Spinner /> : <Check className="size-3.5" />}
                    </Button>
                    <Button size="icon" variant="ghost" className="size-7 shrink-0" onClick={cancelEdit} disabled={loading}>
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
              {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
            </CardContent>
          </Card>

          {leagues.length > 0 && (
            <Card>
              <CardHeader>
                <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Leagues</h2>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {leagues.map((l) => (
                    <li key={l.id}>
                      <p className="text-sm font-medium">{l.name}</p>
                      <p className="text-xs text-muted-foreground">{l.commissionerId === user?.id ? "Commissioner" : "Member"}</p>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {leagues.some((l) => l.commissionerId === user?.id) && (
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
