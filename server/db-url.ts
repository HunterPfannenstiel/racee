// Merges `schema` into an existing Postgres connection string without
// clobbering params it may already carry (e.g. pgbouncer=true).
export function withSchema(url: string, schema?: string): string {
  if (!schema) return url;
  const parsed = new URL(url);
  parsed.searchParams.set("schema", schema);
  return parsed.toString();
}
