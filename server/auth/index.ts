import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/server/db";

function createAuth() {
  return betterAuth({
    database: prismaAdapter(prisma, {
      provider: "postgresql",
    }),
    baseURL: process.env.BETTER_AUTH_URL!,
    user: {
      additionalFields: {
        isAdmin: {
          type: "boolean",
          defaultValue: false,
        },
      },
    },
    socialProviders: {
      google: {
        prompt: "select_account",
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      },
    },
  });
}

type Auth = ReturnType<typeof createAuth>;

const globalForAuth = globalThis as unknown as { auth: Auth | undefined };

export const auth = globalForAuth.auth ?? createAuth();

if (process.env.NODE_ENV !== "production") globalForAuth.auth = auth;
