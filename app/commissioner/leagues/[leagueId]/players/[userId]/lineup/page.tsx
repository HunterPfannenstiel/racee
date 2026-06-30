"use client";

import { useParams } from "next/navigation";
import { PageShell } from "@/components/ui/page-shell";
import { LineupEditor } from "@/app/commissioner/lineup-editor";

export default function PlayerLineupPage() {
  const { leagueId, userId } = useParams<{ leagueId: string; userId: string }>();

  return (
    <PageShell title="Edit Lineup">
      <LineupEditor leagueId={leagueId} userId={userId} />
    </PageShell>
  );
}
