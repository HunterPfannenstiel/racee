"use client";

import { useState, useCallback, useEffect } from "react";

type InviteLinkState = {
  link: string | null;
  loading: boolean;
  error: string | null;
  confirmation: "deactivate" | "regenerate" | null;
};

function buildLink(token: string): string {
  return `${window.location.origin}/join/${token}`;
}

export function useInviteLink(leagueId: string) {
  const [state, setState] = useState<InviteLinkState>({
    link: null,
    loading: true,
    error: null,
    confirmation: null,
  });

  useEffect(() => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    fetch(`/api/commissioner/leagues/${leagueId}/invite-link`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load invite link");
        return r.json() as Promise<{ token: string | null }>;
      })
      .then(({ token }) => {
        setState((prev) => ({
          ...prev,
          link: token ? buildLink(token) : null,
          loading: false,
        }));
      })
      .catch((e: unknown) => {
        setState((prev) => ({
          ...prev,
          error: e instanceof Error ? e.message : "Failed to load invite link",
          loading: false,
        }));
      });
  }, [leagueId]);

  const generate = useCallback(async () => {
    setState((prev) => ({ ...prev, error: null }));
    try {
      const r = await fetch(
        `/api/commissioner/leagues/${leagueId}/invite-link`,
        { method: "POST" }
      );
      if (!r.ok) throw new Error("Failed to generate invite link");
      const { token } = (await r.json()) as { token: string };
      setState((prev) => ({
        ...prev,
        link: buildLink(token),
        confirmation: null,
      }));
    } catch (e: unknown) {
      setState((prev) => ({
        ...prev,
        error:
          e instanceof Error ? e.message : "Failed to generate invite link",
      }));
    }
  }, [leagueId]);

  const deactivate = useCallback(async () => {
    setState((prev) => ({ ...prev, error: null }));
    try {
      const r = await fetch(
        `/api/commissioner/leagues/${leagueId}/invite-link`,
        { method: "DELETE" }
      );
      if (!r.ok) throw new Error("Failed to deactivate invite link");
      setState((prev) => ({ ...prev, link: null, confirmation: null }));
    } catch (e: unknown) {
      setState((prev) => ({
        ...prev,
        error:
          e instanceof Error ? e.message : "Failed to deactivate invite link",
      }));
    }
  }, [leagueId]);

  const regenerate = useCallback(async () => {
    setState((prev) => ({ ...prev, error: null }));
    try {
      const r = await fetch(
        `/api/commissioner/leagues/${leagueId}/invite-link`,
        { method: "POST" }
      );
      if (!r.ok) throw new Error("Failed to regenerate invite link");
      const { token } = (await r.json()) as { token: string };
      setState((prev) => ({
        ...prev,
        link: buildLink(token),
        confirmation: null,
      }));
    } catch (e: unknown) {
      setState((prev) => ({
        ...prev,
        error:
          e instanceof Error ? e.message : "Failed to regenerate invite link",
      }));
    }
  }, [leagueId]);

  const setConfirmation = useCallback(
    (confirmation: "deactivate" | "regenerate" | null) => {
      setState((prev) => ({ ...prev, confirmation }));
    },
    []
  );

  return {
    link: state.link,
    loading: state.loading,
    error: state.error,
    confirmation: state.confirmation,
    generate,
    deactivate,
    regenerate,
    setConfirmation,
  };
}
