"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type InviteLinkProps = {
  link: string | null;
  confirmation: "deactivate" | "regenerate" | null;
  onGenerate: () => void;
  onDeactivate: () => void;
  onRegenerate: () => void;
  onConfirmationChange: (confirmation: "deactivate" | "regenerate" | null) => void;
};

function CopyButton({ link }: { link: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  return (
    <Button
      variant="outline"
      className="flex-1"
      onClick={() => {
        navigator.clipboard.writeText(link);
        setCopied(true);
      }}
    >
      {copied ? "Copied" : "Copy"}
    </Button>
  );
}

export function InviteLink({
  link,
  confirmation,
  onGenerate,
  onDeactivate,
  onRegenerate,
  onConfirmationChange,
}: InviteLinkProps) {
  return (
    <Card>
      <CardHeader>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Invite Link
        </h2>
      </CardHeader>
      <CardContent className="space-y-3">
        {!link ? (
          <Button className="w-full" onClick={onGenerate}>
            Generate Link
          </Button>
        ) : (
          <>
            <p className="text-sm text-muted-foreground truncate">{link}</p>

            <div className="flex gap-2">
              <CopyButton link={link} />
              <Button
                variant="outline"
                className="flex-1"
                onClick={() =>
                  onConfirmationChange(
                    confirmation === "deactivate" ? null : "deactivate"
                  )
                }
              >
                Deactivate
              </Button>
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={() =>
                onConfirmationChange(
                  confirmation === "regenerate" ? null : "regenerate"
                )
              }
            >
              Regenerate
            </Button>
          </>
        )}
      </CardContent>

      {confirmation && (
        <div className="px-4 py-3 border-t border-border">
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {confirmation === "deactivate"
                ? "Anyone with this link will no longer be able to join."
                : "The current link will stop working and a new one will be created."}
            </p>
            <Button
              variant={confirmation === "deactivate" ? "destructive" : "default"}
              className="w-full"
              onClick={
                confirmation === "deactivate" ? onDeactivate : onRegenerate
              }
            >
              {confirmation === "deactivate" ? "Deactivate" : "Regenerate"}
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
