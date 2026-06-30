"use client";

import { useState, useEffect } from "react";

export type PendingPlayer = {
  id: string;
  name: string;
  role: "member";
};

export type Member = {
  id: string;
  name: string;
  role: "co-commissioner" | "member";
};

export function usePlayersList(leagueId: string) {
  const [pending, setPending] = useState<PendingPlayer[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionPending, setActionPending] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/commissioner/leagues/${leagueId}/players`)
      .then((r) => r.json())
      .then((data: { pending: PendingPlayer[]; members: Member[] } | { error: string }) => {
        if (cancelled) return;
        if ("error" in data) {
          setError(data.error);
        } else {
          setPending(data.pending);
          setMembers(data.members);
        }
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setError("Failed to load players.");
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [leagueId]);

  function addActionPending(id: string) {
    setActionPending((prev) => new Set(prev).add(id));
  }

  function removeActionPending(id: string) {
    setActionPending((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  async function accept(id: string) {
    addActionPending(id);
    try {
      const r = await fetch(
        `/api/commissioner/leagues/${leagueId}/players/${id}/accept`,
        { method: "POST" },
      );
      if (!r.ok) return;
      const player = pending.find((p) => p.id === id);
      if (player) {
        setPending((prev) => prev.filter((p) => p.id !== id));
        setMembers((prev) => [
          ...prev,
          { id: player.id, name: player.name, role: "member" as const },
        ]);
      }
    } finally {
      removeActionPending(id);
    }
  }

  async function deny(id: string) {
    addActionPending(id);
    try {
      const r = await fetch(
        `/api/commissioner/leagues/${leagueId}/players/${id}/deny`,
        { method: "POST" },
      );
      if (!r.ok) return;
      setPending((prev) => prev.filter((p) => p.id !== id));
    } finally {
      removeActionPending(id);
    }
  }

  async function remove(id: string) {
    addActionPending(id);
    try {
      const r = await fetch(
        `/api/commissioner/leagues/${leagueId}/players/${id}/remove`,
        { method: "POST" },
      );
      if (!r.ok) return;
      setMembers((prev) => prev.filter((m) => m.id !== id));
    } finally {
      removeActionPending(id);
    }
  }

  return { pending, members, loading, error, accept, deny, remove, actionPending };
}
