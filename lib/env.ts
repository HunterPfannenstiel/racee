export type AppEnv = "local" | "integration" | "preview" | "production"

export function getAppEnv(): AppEnv {
  const vercelEnv = process.env.NEXT_PUBLIC_VERCEL_ENV
  const gitBranch = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF

  if (!vercelEnv) return "local"
  if (vercelEnv === "preview" && gitBranch === "integration") return "integration"
  if (vercelEnv === "preview") return "preview"
  return "production"
}
