"use client";

import { useState } from "react";
import { Flag } from "lucide-react";
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
            ) : (
              <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={() => setReporting(true)}>
                <Flag className="size-3.5" />
                Report photo
              </Button>
            ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
