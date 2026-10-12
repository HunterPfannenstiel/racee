"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageShell } from "@/components/ui/page-shell";
import { QueryLoading } from "@/components/ui/query-state";
import { RequireUser } from "@/components/RequireUser";
import { useUser } from "@/app/context/UserContext";

/** Your profile is the same page everyone else sees; settings live at /profile/settings. */
export default function ProfileRedirectPage() {
  const router = useRouter();
  const { user } = useUser();
  useEffect(() => {
    if (user) router.replace(`/players/${user.id}`);
  }, [user, router]);

  return (
    <PageShell title="Profile">
      <RequireUser>
        <QueryLoading />
      </RequireUser>
    </PageShell>
  );
}
