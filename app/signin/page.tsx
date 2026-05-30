"use client";

import { signInWithGoogle } from "@/server/auth/auth-client";
import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/ui/page-shell";
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";
import { Spinner } from "@/components/ui/spinner";

export default function SigninPage() {
  const [loading, setLoading] = useState(false);

  async function handleSignIn() {
    setLoading(true);
    await signInWithGoogle();
    setLoading(false);
  }

  return (
    <PageShell title="Sign In">
      <Card>
        <CardContent className="pt-6">
          <Button onClick={handleSignIn} disabled={loading} className="w-full">
            {loading ? <Spinner /> : "Sign in with Google"}
          </Button>
        </CardContent>
      </Card>
    </PageShell>
  );
}
