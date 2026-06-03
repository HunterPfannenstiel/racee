"use client";

import { signInWithGoogle } from "@/server/auth/auth-client";
import { PageShell } from "@/components/ui/page-shell";
import { Spinner } from "@/components/ui/spinner";
import { useState } from "react";

export default function SigninPage() {
  const [loading, setLoading] = useState(false);

  async function handleSignIn() {
    setLoading(true);
    await signInWithGoogle();
    setLoading(false);
  }

  return (
    <PageShell title="Sign In">
      <button
        onClick={handleSignIn}
        disabled={loading}
        className="flex items-center justify-center w-full h-14 rounded-md bg-primary text-primary-foreground font-heading text-2xl font-bold uppercase tracking-[0.08em] hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {loading ? <Spinner /> : "Sign in with Google"}
      </button>
    </PageShell>
  );
}
