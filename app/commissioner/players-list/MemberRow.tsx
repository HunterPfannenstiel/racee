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

  return (
    <>
      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-sm">
          {member.name}
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

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {member.name} from the league?</AlertDialogTitle>
            <AlertDialogDescription>
              They'll lose access immediately. Do you want to keep their past scores in the
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
