import { getSession } from "./server";

export class AuthError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "AuthError";
  }
}

export async function requireAdmin() {
  const session = await getSession();
  if (!session) throw new AuthError();
  if (!session.user.isAdmin) throw new AuthError("Forbidden");
  return session;
}
