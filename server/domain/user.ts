// User is Prisma-managed. Read-only in the domain layer.
export interface User {
  userId: string;
  name: string;
  isAdmin: boolean;
}
