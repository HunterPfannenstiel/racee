"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { type User } from "@/lib/schemas";

type UserContextValue = {
  user: User | null;
  setUser: (user: User) => void;
  clearUser: () => void;
};

const UserContext = createContext<UserContextValue>({ user: null, setUser: () => {}, clearUser: () => {} });

export function UserContextProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) setUserState(JSON.parse(stored));
  }, []);

  function setUser(user: User) {
    localStorage.setItem("user", JSON.stringify(user));
    setUserState(user);
  }

  function clearUser() {
    localStorage.removeItem("user");
    setUserState(null);
  }

  return <UserContext.Provider value={{ user, setUser, clearUser }}>{children}</UserContext.Provider>;
}

export function useUser() {
  return useContext(UserContext);
}
