"use client";

import { useState } from "react";
import { Flag, MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useMutation } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

type ReportTarget =
  | { kind: "avatar"; userId: string }
  | { kind: "teamLogo"; leagueId: string; teamId: string };

type Props = {
  open: boolean;
  onClose: () => void;
  /** Name under the picture. */
  title: string;
  /** The enlarged picture. */
  children: React.ReactNode;
  /** Set when the picture is an uploaded photo someone else can report. */
  reportTarget?: ReportTarget | null;
};

/** A picture blown up to full size, with an option to report it to the admins. */
export function PhotoLightbox({ open, onClose, title, children, reportTarget }: Props) {
  const [reporting, setReporting] = useState(false);
  const [reason, setReason] = useState("");
  const report = useMutation(orpc.moderation.report.mutationOptions());

  const close = () => {
    onClose();
    setReporting(false);
    setReason("");
    report.reset();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent className="sm:max-w-sm" onClick={(e) => e.stopPropagation()}>
        {/* Reporting is tucked into a menu so it isn't the first thing you see. */}
        {reportTarget && !reporting && !report.isSuccess && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="absolute left-3 top-3 rounded-sm p-1 text-muted-foreground opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label="More options"
              >
                <MoreHorizontal className="size-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onSelect={() => setReporting(true)}>
                <Flag className="size-3.5" />
                Report photo
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        <div className="flex flex-col items-center gap-4 pt-2">
          {children}
          <DialogTitle className="text-center font-heading text-2xl">{title}</DialogTitle>

          {reportTarget &&
            (report.isSuccess ? (
              <p className="text-center text-sm text-muted-foreground">Thanks — an admin will review this photo.</p>
            ) : reporting ? (
              <div className="w-full space-y-2">
                <Input
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  maxLength={200}
                  placeholder="What's wrong with it? (optional)"
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    className="flex-1"
                    disabled={report.isPending}
                    onClick={() => report.mutate({ target: reportTarget, reason: reason.trim() || undefined })}
                  >
                    {report.isPending && <Spinner className="mr-1 size-3" />}
                    Send report
                  </Button>
                  <Button variant="outline" onClick={() => setReporting(false)} disabled={report.isPending}>
                    Cancel
                  </Button>
                </div>
                {report.isError && (
                  <p className="text-xs text-destructive">
                    {report.error instanceof Error ? report.error.message : "Couldn't send the report."}
                  </p>
                )}
              </div>
            ) : null)}
        </div>
      </DialogContent>
    </Dialog>
  );
}
