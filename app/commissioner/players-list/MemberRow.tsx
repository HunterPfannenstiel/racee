"use client";

import { useState } from "react";
import Link from "next/link";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Member } from "./types";
import { LeaguePlayerAvatar } from "@/components/avatar/LeaguePlayerAvatar";
import { PlayerColorDialog } from "./PlayerColorDialog";
import { useLeagueAvatars } from "@/components/avatar/useLeagueAvatars";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc/client";

type MemberRowProps = {
  leagueId: string;
  member: Member;
  /** Everyone else in the league — candidates to take over when the commissioner leaves. */
  otherMembers: Member[];
  onRemove: (clearScores: boolean, newCommissionerId?: string) => void;
  isRemovePending: boolean;
};

export function MemberRow({ leagueId, member, otherMembers, onRemove, isRemovePending }: MemberRowProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [newCommissionerId, setNewCommissionerId] = useState("");
  const isCommissioner = member.role === "commissioner";
  const needsSuccessor = isCommissioner && !newCommissionerId;
  const remove = (clearScores: boolean) => onRemove(clearScores, isCommissioner ? newCommissionerId : undefined);
  const [colorOpen, setColorOpen] = useState(false);
  const queryClient = useQueryClient();
  const { byUserId } = useLeagueAvatars(leagueId);
  const avatar = byUserId[member.id];
  const hideMutation = useMutation(
    orpc.leagues.players.setAvatarHidden.mutationOptions({
      onSuccess: () => queryClient.invalidateQueries({ queryKey: orpc.leagues.avatars.list.key({ input: { leagueId } }) }),
    }),
  );

  return (
    <>
      <div className="flex items-center justify-between px-4 py-3">
        <span className="flex min-w-0 items-center gap-2 text-sm">
          <LeaguePlayerAvatar leagueId={leagueId} userId={member.id} name={member.name} size="md" />
          <span className="truncate">{member.name}</span>
          {isCommissioner && <span className="ml-2 text-xs text-muted-foreground">Commissioner</span>}
          {member.role === "co-commissioner" && <span className="ml-2 text-xs text-muted-foreground">Co-commissioner</span>}
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href={`/commissioner/leagues/${leagueId}/players/${member.id}/lineup`}>
                  Edit Lineup
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setColorOpen(true)}>
                Change color
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={hideMutation.isPending || !avatar}
                onSelect={() => hideMutation.mutate({ leagueId, userId: member.id, hidden: !avatar?.hidden })}
              >
                {avatar?.hidden ? "Show picture" : "Hide picture"}
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => setConfirmOpen(true)}
              >
                {isCommissioner ? "Leave & hand over league" : "Remove from league"}
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {colorOpen && (
        <PlayerColorDialog
          leagueId={leagueId}
          member={member}
          currentColor={avatar?.playerColor}
          onTeamColor={!!avatar && avatar.color !== avatar.playerColor}
          onClose={() => setColorOpen(false)}
        />
      )}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {member.name} from the league?</AlertDialogTitle>
            <AlertDialogDescription>
              They&apos;ll lose access immediately. Do you want to keep their past scores in the
              standings, or clear them out completely?
            </AlertDialogDescription>
          </AlertDialogHeader>
          {isCommissioner && (
            <div className="space-y-1">
              <label htmlFor={`successor-${member.id}`} className="text-xs text-muted-foreground">
                New commissioner (required)
              </label>
              <select
                id={`successor-${member.id}`}
                value={newCommissionerId}
                onChange={(e) => setNewCommissionerId(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Choose a player…</option>
                {otherMembers.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="outline" onClick={() => remove(false)} disabled={isRemovePending || needsSuccessor}>
              Remove, keep scores
            </AlertDialogAction>
            <AlertDialogAction variant="destructive" onClick={() => remove(true)} disabled={isRemovePending || needsSuccessor}>
              Remove &amp; clear scores
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
