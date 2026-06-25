"use client";

import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InviteLink } from "./InviteLink";
import { useInviteLink } from "./hooks/useInviteLink";

type ConnectedInviteLinkProps = {
  leagueId: string;
};

export function ConnectedInviteLink({ leagueId }: ConnectedInviteLinkProps) {
  const {
    link,
    loading,
    error,
    confirmation,
    generate,
    deactivate,
    regenerate,
    setConfirmation,
  } = useInviteLink(leagueId);

  if (loading) return <Spinner className="w-4 h-4" />;
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

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
