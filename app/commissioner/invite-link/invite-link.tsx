"use client";

import { ConnectedInviteLink } from "./ConnectedInviteLink";

/** Kept for the prototype page — the live implementation is ConnectedInviteLink. */
export function InviteLinkFeature({ leagueId }: { leagueId: string }) {
  return <ConnectedInviteLink leagueId={leagueId} />;
}
