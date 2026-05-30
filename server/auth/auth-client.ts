"use client";
import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";
import type { auth } from "@/server/auth";

const authClient = createAuthClient({
  plugins: [inferAdditionalFields<typeof auth>()],
});

export const { signOut, useSession } = authClient;

export const signInWithGoogle = async () => {
  await authClient.signIn.social({
    provider: "google",
  });
};
