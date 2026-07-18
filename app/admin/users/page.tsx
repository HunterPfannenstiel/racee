"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc/client";
import { PageShell } from "@/components/ui/page-shell";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { QueryLoading, QueryError } from "@/components/ui/query-state";
import { UsersSection } from "./UsersSection";
import { OverhaulNotice } from "@/components/ui/overhaul-notice";

export default function AdminUsersPage() {
  const [error, setError] = useState<string | null>(null);
  const usersQuery = useQuery(orpc.users.list.queryOptions());

  return (
    <PageShell title="Users">
      <Link href="/admin" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
        ← Admin
      </Link>
      <OverhaulNotice />
      {error && (
        <Alert variant="destructive">
          <AlertDescription className="flex items-center justify-between">
            {error}
            <Button variant="ghost" size="sm" onClick={() => setError(null)}>✕</Button>
          </AlertDescription>
        </Alert>
      )}
      {usersQuery.isPending ? (
        <QueryLoading />
      ) : usersQuery.isError ? (
        <QueryError error={usersQuery.error} onRetry={() => usersQuery.refetch()} />
      ) : (
        <UsersSection users={usersQuery.data} onError={setError} />
      )}
    </PageShell>
  );
}
