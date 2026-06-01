"use client";

import { useState, useEffect } from "react";
import { Pencil, Check, X } from "lucide-react";
import { useUser } from "@/app/context/UserContext";
import { PageShell } from "@/components/ui/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

type LeagueMembership = {
  id: string;
  name: string;
  role: "Admin" | "Member";
};

export default function AccountForm() {
  const { user, updateName } = useUser();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [leagues, setLeagues] = useState<LeagueMembership[]>([]);

  useEffect(() => {
    if (!user) return;
    fetch("/api/leagues")
      .then((r) => r.json())
      .then((data: Array<{ id: string; name: string; commissionerId: string }>) => {
        setLeagues(
          data.map((l) => ({
            id: l.id,
            name: l.name,
            role: l.commissionerId === user.id ? "Admin" : "Member",
          }))
        );
      })
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
    <PageShell title="Account">
      <div className="space-y-4 max-w-sm">
        <Card>
          <CardHeader>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Profile</h2>
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
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-7 shrink-0"
                    onClick={handleSave}
                    disabled={loading || name.trim().length === 0}
                  >
                    {loading ? <Spinner /> : <Check className="size-3.5" />}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-7 shrink-0"
                    onClick={cancelEdit}
                    disabled={loading}
                  >
                    <X className="size-3.5" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="text-sm font-medium truncate">{user?.name}</span>
                  <button
                    onClick={startEdit}
                    className="text-muted-foreground hover:text-foreground transition-colors shrink-0 ml-auto"
                    aria-label="Edit username"
                  >
                    <Pencil className="size-3.5" />
                  </button>
                </div>
              )}
            </div>
            {error && (
              <p className="mt-2 text-xs text-destructive">{error}</p>
            )}
          </CardContent>
        </Card>

        {leagues.length > 0 && (
          <Card>
            <CardHeader>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Leagues</h2>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {leagues.map((l) => (
                  <li key={l.id} className="text-sm text-foreground">
                    {l.name}
                    <span className="text-muted-foreground"> · {l.role}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </PageShell>
  );
}
