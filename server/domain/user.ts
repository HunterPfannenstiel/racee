// User is Prisma-managed. Read-only in the domain layer.
export interface User {
  userId: string;
  name: string;
  isAdmin: boolean;
  /** Avatar value — see lib/avatar.ts for the format. */
  image: string | null;
}
