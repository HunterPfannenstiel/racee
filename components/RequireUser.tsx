"use client";

import Link from "next/link";
import { useUser } from "@/app/context/UserContext";

export function RequireUser({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  if (!user) {
    return (
      <div>
        <Link href="/signup">Sign in</Link> to continue.
      </div>
    );
  }
  return <>{children}</>;
}
