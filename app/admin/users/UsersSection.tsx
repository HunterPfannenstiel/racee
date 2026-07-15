"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@/app/context/UserContext";
import { orpc } from "@/lib/orpc/client";
import type { UserDTO } from "@/server/rpc/routers/users";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Spinner } from "@/components/ui/spinner";

type Props = {
  users: UserDTO[];
  onError: (msg: string) => void;
};

export function UsersSection({ users, onError }: Props) {
  const { user: currentUser } = useUser();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Record<string, boolean>>({});

  const setAdminMutation = useMutation(orpc.users.setAdmin.mutationOptions());
  const saving = setAdminMutation.isPending;

  const currentFirst = [...users].sort((a, b) => {
    if (a.id === currentUser?.id) return -1;
    if (b.id === currentUser?.id) return 1;
    return 0;
  });

  function startEdit() {
    const initial: Record<string, boolean> = {};
    for (const u of users) initial[u.id] = u.isAdmin;
    setDraft(initial);
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setDraft({});
  }

  async function handleSave() {
    const changed = users.filter((u) => draft[u.id] !== u.isAdmin);
    if (changed.length === 0) {
      setEditing(false);
      return;
    }
    try {
      await Promise.all(
        changed.map((u) => setAdminMutation.mutateAsync({ userId: u.id, isAdmin: draft[u.id] })),
      );
      queryClient.invalidateQueries({ queryKey: orpc.users.list.key() });
      setEditing(false);
      setDraft({});
    } catch {
      onError("Failed to update users.");
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Users</h2>
          {editing ? (
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={handleSave} disabled={saving}>
                {saving && <Spinner className="w-3 h-3 mr-1" />}
                Save
              </Button>
              <Button size="sm" variant="ghost" onClick={cancelEdit} disabled={saving}>
                Cancel
              </Button>
            </div>
          ) : (
            <Button size="sm" variant="ghost" onClick={startEdit}>Edit</Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="divide-y divide-border">
          {currentFirst.map((user) => {
            const isSelf = user.id === currentUser?.id;
            return (
              <div key={user.id} className="flex items-center gap-4 py-3">
                <span className={`text-sm flex-1 ${isSelf ? "text-muted-foreground" : ""}`}>
                  {user.name}
                  {isSelf && <span className="ml-2 text-xs text-muted-foreground">(you)</span>}
                </span>
                <Switch
                  checked={editing ? (draft[user.id] ?? user.isAdmin) : user.isAdmin}
                  onCheckedChange={editing && !isSelf ? (val) => setDraft((d) => ({ ...d, [user.id]: val })) : undefined}
                  disabled={!editing || isSelf || saving}
                />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
