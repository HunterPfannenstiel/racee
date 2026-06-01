"use client";

import { useState } from "react";
import { Pencil, Check, X } from "lucide-react";
import { useUser } from "@/app/context/UserContext";
import { PageShell } from "@/components/ui/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

export default function AccountForm() {
  const { user, updateName } = useUser();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <PageShell title="Account">
      <div className="rounded-sm border border-border">
        <div className="flex items-center justify-between px-4 py-3 gap-4">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide shrink-0">
            Username
          </span>
          {editing ? (
            <div className="flex items-center gap-1.5 min-w-0">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={30}
                disabled={loading}
                autoFocus
                className="h-7 text-sm w-40"
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
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm truncate">{user?.name}</span>
              <button
                onClick={startEdit}
                className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                aria-label="Edit username"
              >
                <Pencil className="size-3.5" />
              </button>
            </div>
          )}
        </div>
        {error && (
          <p className="px-4 pb-3 text-xs text-destructive">{error}</p>
        )}
      </div>
    </PageShell>
  );
}
