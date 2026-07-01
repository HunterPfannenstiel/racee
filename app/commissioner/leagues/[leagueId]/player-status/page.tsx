"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { PageShell } from "@/components/ui/page-shell";
import { PlayerStatus } from "@/app/commissioner/player-status";

export default function PlayerStatusPage() {
  const { leagueId } = useParams<{ leagueId: string }>();

  return (
    <PageShell title="Submission Status">
      <Link
        href={`/commissioner/leagues/${leagueId}`}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors w-fit"
      >
        <ChevronLeft className="size-3.5" />
        League
      </Link>
      <PlayerStatus leagueId={leagueId} />
    </PageShell>
  );
}
