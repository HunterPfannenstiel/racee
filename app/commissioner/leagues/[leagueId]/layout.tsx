"use client";

import { useParams } from "next/navigation";
import { AvatarLeagueScope } from "@/components/avatar/AvatarLeagueScope";

/** Every avatar on this league's commissioner pages uses this league's colors. */
export default function CommissionerLeagueLayout({ children }: { children: React.ReactNode }) {
  const params = useParams<{ leagueId: string }>();
  return <AvatarLeagueScope leagueId={params?.leagueId ?? null}>{children}</AvatarLeagueScope>;
}
