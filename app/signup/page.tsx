"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { type Participants } from "@/lib/schemas";
import { useUser } from "@/app/context/UserContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PageShell } from "@/components/ui/page-shell";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";

export default function SignupPage() {
  const { setUser } = useUser();
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignup() {
    const trimmed = name.trim();
    if (!trimmed) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/participants");
      if (!res.ok) throw new Error();
      const data: Participants = await res.json();
      const newUser = { id: crypto.randomUUID(), name: trimmed };
      const put = await fetch("/api/participants", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ users: [...data.users, newUser] }),
      });
      if (!put.ok) throw new Error();
      setUser(newUser);
      router.push("/teams");
    } catch {
      setError("Failed to sign up. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageShell title="Sign Up">
      {error && (
        <Alert variant="destructive">
          <AlertDescription className="flex items-center justify-between">
            {error}
            <Button variant="ghost" size="sm" onClick={() => setError(null)}>✕</Button>
          </AlertDescription>
        </Alert>
      )}
      <Card>
        <CardHeader>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">What's your name?</h2>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !loading && handleSignup()}
            placeholder="Your name"
            disabled={loading}
            autoFocus
          />
          <Button onClick={handleSignup} disabled={!name.trim() || loading} className="w-full">
            {loading ? <Spinner /> : "Sign Up"}
          </Button>
        </CardContent>
      </Card>
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/signin" className="text-primary hover:underline">Sign in</Link>
      </p>
    </PageShell>
  );
}
