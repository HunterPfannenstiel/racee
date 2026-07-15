// Pending entries are always role "member" at runtime, but the wire schema
// shares the member DTO, so the type mirrors it.
export type PendingPlayer = {
  id: string;
  name: string;
  role: "co-commissioner" | "member";
};

export type Member = {
  id: string;
  name: string;
  role: "co-commissioner" | "member";
};
