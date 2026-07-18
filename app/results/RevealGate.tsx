"use client";

import { Empty, EmptyHeader, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";

type RevealGateProps = {
  onPlayCutscene: () => void;
  onShowResults: () => void;
  disabled?: boolean;
  raceName?: string;
};

/**
 * Choice screen shown before a race's results have been "revealed": play the
 * cutscene reveal or skip straight to standings. Purely presentational --
 * which screen shows (this vs. ResultsView) is driven by local state owned
 * by the page, not by anything in here. See app/results/page.tsx.
 */
export function RevealGate({ onPlayCutscene, onShowResults, disabled, raceName }: RevealGateProps) {
  return (
    <div className="mx-4">
      <Empty>
        <EmptyHeader>
          <EmptyTitle>Results are ready</EmptyTitle>
          {raceName && <p>{raceName}</p>}
          <EmptyDescription>Play the reveal, or skip straight to the results.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <div className="flex w-full gap-2">
            <Button className="flex-1 gap-2" onClick={onPlayCutscene} disabled={disabled}>
              Play Reveal
              <Play />
            </Button>
            <Button className="flex-1" variant="outline" onClick={onShowResults}>
              Show Results
            </Button>
          </div>
        </EmptyContent>
      </Empty>
    </div>
  );
}
