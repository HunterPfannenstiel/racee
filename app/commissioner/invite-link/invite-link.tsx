"use client";

import { InviteLink } from "./InviteLink";
import { useInviteLink } from "./hooks/useInviteLink";

export function InviteLinkFeature({ leagueId }: { leagueId: string }) {
  const {
    link,
    confirmation,
    generate,
    deactivate,
    regenerate,
    setConfirmation,
  } = useInviteLink(leagueId);

  return (
    <InviteLink
      link={link}
      confirmation={confirmation}
      onGenerate={generate}
      onDeactivate={deactivate}
      onRegenerate={regenerate}
      onConfirmationChange={setConfirmation}
    />
  );
}
