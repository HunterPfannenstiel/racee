"use client";

import { useEffect, useState, useCallback } from "react";

export type Member = {
  id: string;
  name: string;
};

type LeagueMemberDTO = {
  id: string;
  name: string;
  role: "co-commissioner" | "member";
};

export function useCoCommissioner(leagueId: string) {
  const [members, setMembers] = useState<Member[]>([]);
  const [coCommissioners, setCoCommissioners] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [hidden, setHidden] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/commissioner/leagues/${leagueId}/members`)
      .then((r) => {
        if (r.status === 401) return null;
        if (!r.ok) throw new Error("Failed to load members");
        return r.json() as Promise<LeagueMemberDTO[]>;
      })
      .then((data) => {
        if (!data) { setHidden(true); return; }
        setCoCommissioners(data.filter((d) => d.role === "co-commissioner"));
        setMembers(data.filter((d) => d.role === "member"));
      })
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : "Failed to load members")
      )
      .finally(() => setLoading(false));
  }, [leagueId]);

  const updateRole = useCallback(
    async (userId: string, role: "co-commissioner" | "member") => {
      const res = await fetch(
        `/api/commissioner/leagues/${leagueId}/members/${userId}/role`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role }),
        }
      );
      if (!res.ok) throw new Error("Failed to update role");
    },
    [leagueId]
  );

  async function promote(id: string) {
    const member = members.find((m) => m.id === id);
    if (!member) return;
    await updateRole(id, "co-commissioner");
    setMembers((prev) => prev.filter((m) => m.id !== id));
    setCoCommissioners((prev) => [...prev, member]);
  }

  async function demote(id: string) {
    const coComm = coCommissioners.find((m) => m.id === id);
    if (!coComm) return;
    await updateRole(id, "member");
    setCoCommissioners((prev) => prev.filter((m) => m.id !== id));
    setMembers((prev) => [...prev, coComm]);
  }

  return { members, coCommissioners, loading, hidden, error, promote, demote };
}
