"use client";

import Link from "next/link";
import { useUser } from "@/app/context/UserContext";

export function RequireUser({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  if (!user) {
    return (
      <p className="text-sm text-muted-foreground">
        <Link href="/signin" className="text-primary underline-offset-4 hover:underline font-medium">
          Sign in
        </Link>{" "}
        to continue.
      </p>
    );
  }
  return <>{children}</>;
}
