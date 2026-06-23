"use client";

import {
  PrototypeLayout,
  PrototypeSection,
} from "@/app/prototype/PrototypeLayout";
import { TeammateLineup } from "@/app/predict/teammate-lineup/teammate-lineup";
import { TeammateSelector } from "@/app/predict/teammate-lineup/TeammateSelector";
import { SubmissionAttribution } from "@/app/predict/teammate-lineup/SubmissionAttribution";
import { useState } from "react";

function TeammateSelectorDemo() {
  const names = ["You", "Kolby", "Tommy", "Jake"];
  const [index, setIndex] = useState(0);
  const isProxy = index !== 0;

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Cycle through teammates. &quot;You&quot; shows no underline; teammates
        get a team-color underline.
      </p>
      <TeammateSelector
        displayName={names[index]}
        isProxy={isProxy}
        teamColor="#e11d48"
        onPrev={() => setIndex((i) => (i - 1 + names.length) % names.length)}
        onNext={() => setIndex((i) => (i + 1) % names.length)}
      />
    </div>
  );
}

export default function TeammateLineupPrototype() {
  return (
    <PrototypeLayout
      feature="Teammate Lineup Setting"
      assembled={<TeammateLineup />}
    >
      <PrototypeSection name="Teammate Selector">
        <TeammateSelectorDemo />
      </PrototypeSection>

      <PrototypeSection name="Submission Attribution">
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Shown in the submitted badge area when a lineup was set by someone
            other than the owner.
          </p>
          <SubmissionAttribution submittedByName="Hunter" teamColor="#e11d48" />
        </div>
      </PrototypeSection>
    </PrototypeLayout>
  );
}
