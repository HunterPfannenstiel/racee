"use client";

import { useState } from "react";
import type { Member } from "./useCoCommissioner";

const MOCK_CO_COMMISSIONERS: Member[] = [
  { id: "co-1", name: "Sebastian Vettel" },
];

const MOCK_MEMBERS: Member[] = [
  { id: "m-1", name: "Lando Norris" },
  { id: "m-2", name: "Carlos Sainz" },
  { id: "m-3", name: "Oscar Piastri" },
  { id: "m-4", name: "George Russell" },
];

export function useMockCoCommissioner() {
  const [members, setMembers] = useState<Member[]>(MOCK_MEMBERS);
  const [coCommissioners, setCoCommissioners] = useState<Member[]>(MOCK_CO_COMMISSIONERS);

  function promote(id: string) {
    const member = members.find((m) => m.id === id);
    if (!member) return;
    setMembers((prev) => prev.filter((m) => m.id !== id));
    setCoCommissioners((prev) => [...prev, member]);
  }

  function demote(id: string) {
    const coComm = coCommissioners.find((m) => m.id === id);
    if (!coComm) return;
    setCoCommissioners((prev) => prev.filter((m) => m.id !== id));
    setMembers((prev) => [...prev, coComm]);
  }

  return { members, coCommissioners, promote, demote };
}
