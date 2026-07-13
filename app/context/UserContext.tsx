"use client";
import { createContext, useContext } from "react";
import { useSession } from "@/server/auth/auth-client";
import { type User } from "@/lib/schemas";

/**
 * Division of responsibility: UserContext carries better-auth session state
 * only, for auth gating — who is signed in, `isAdmin`, and the loading flag
 * that gates like `RequireUser` consume. Server profile data (display name,
 * leagues, etc.) belongs to `orpc.me.get` via TanStack Query — components
 * must not add server state here.
 */
type UserContextValue = {
  user: User | null;
  isAdmin: boolean;
  isLoading: boolean;
};

const UserContext = createContext<UserContextValue>({
  user: null,
  isAdmin: false,
  isLoading: true,
});

export function UserContextProvider({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession();

  const sessionUser = session?.user ?? null;
  const user: User | null = sessionUser
    ? { id: sessionUser.id, name: sessionUser.name }
    : null;

  const isAdmin = sessionUser?.isAdmin ?? false;

  return (
    <UserContext.Provider value={{ user, isAdmin, isLoading: isPending }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
