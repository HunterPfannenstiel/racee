"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { type Participants } from "@/lib/schemas";
import { useUser } from "@/app/context/UserContext";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/ui/page-shell";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

export default function SigninPage() {
  const { setUser } = useUser();
  const router = useRouter();
  const [users, setUsers] = useState<Participants["users"]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/participants")
      .then((res) => res.json())
      .then((data: Participants) => setUsers(data.users))
      .catch(() => setError("Failed to load users."));
  }, []);

  function handleSelect(user: Participants["users"][number]) {
    setUser(user);
    router.push("/");
  }

  return (
    <PageShell title="Sign In">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <Card>
        <CardHeader>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Who are you?</h2>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <p className="text-sm text-muted-foreground">No users yet.</p>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {users.map((u) => (
                <Button
                  key={u.id}
                  variant="outline"
                  className="h-14 text-base font-medium"
                  onClick={() => handleSelect(u)}
                >
                  {u.name}
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      <p className="text-center text-sm text-muted-foreground">
        New here?{" "}
        <Link href="/signup" className="text-primary hover:underline">Sign up</Link>
      </p>
    </PageShell>
  );
}
