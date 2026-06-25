"use client";

import {
  PrototypeLayout,
  PrototypeSection,
} from "@/app/prototype/PrototypeLayout";
import { InviteLinkFeature } from "@/app/commissioner/invite-link/invite-link";
import { InviteLink } from "@/app/commissioner/invite-link/InviteLink";

export default function InviteLinkPrototype() {
  return (
    <PrototypeLayout
      feature="Invite Link"
      assembled={
        <div className="p-4">
          <InviteLinkFeature leagueId="prototype" />
        </div>
      }
    >
      <PrototypeSection name="Empty State (No Link)">
        <InviteLink
          link={null}
          confirmation={null}
          onGenerate={() => {}}
          onDeactivate={() => {}}
          onRegenerate={() => {}}
          onConfirmationChange={() => {}}
        />
      </PrototypeSection>

      <PrototypeSection name="Active Link">
        <InviteLink
          link="https://racee.app/join/abc12345"
          confirmation={null}
          onGenerate={() => {}}
          onDeactivate={() => {}}
          onRegenerate={() => {}}
          onConfirmationChange={() => {}}
        />
      </PrototypeSection>

      <PrototypeSection name="Deactivate Confirmation">
        <InviteLink
          link="https://racee.app/join/abc12345"
          confirmation="deactivate"
          onGenerate={() => {}}
          onDeactivate={() => {}}
          onRegenerate={() => {}}
          onConfirmationChange={() => {}}
        />
      </PrototypeSection>

      <PrototypeSection name="Regenerate Confirmation">
        <InviteLink
          link="https://racee.app/join/abc12345"
          confirmation="regenerate"
          onGenerate={() => {}}
          onDeactivate={() => {}}
          onRegenerate={() => {}}
          onConfirmationChange={() => {}}
        />
      </PrototypeSection>
    </PrototypeLayout>
  );
}
