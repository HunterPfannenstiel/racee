import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

const BACKUP_BUCKET = requireEnv("BACKUP_BUCKET");

const RETAIN = Number(process.env.BACKUP_RETENTION);
if (!Number.isInteger(RETAIN) || RETAIN < 1) {
  throw new Error("BACKUP_RETENTION is not set to a valid positive integer");
}

const DATABASE_SCHEMA = process.env.DATABASE_SCHEMA;

const sourceBucket = requireEnv("BUCKET_NAME");
const DIRECT_URL = requireEnv("DIRECT_URL");

const SUPABASE_URL = requireEnv("SUPABASE_URL");
const SUPABASE_SECRET_KEY = requireEnv("SUPABASE_SECRET_KEY");

const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY);

async function listAllObjects(bucket: string, folder = ""): Promise<string[]> {
  const { data, error } = await supabase.storage.from(bucket).list(folder);
  if (error) throw error;
  if (!data) return [];
  const prefix = folder ? `${folder}/` : "";
  const files = data.filter((i) => i.id !== null).map((i) => `${prefix}${i.name}`);
  const subfolders = data.filter((i) => i.id === null).map((i) => `${prefix}${i.name}`);
  const nested = await Promise.all(subfolders.map((f) => listAllObjects(bucket, f)));
  return [...files, ...nested.flat()];
}

function dumpDatabase(runDir: string): string {
  const file = path.join(runDir, "db.dump");
  execFileSync("pg_dump", [
    DIRECT_URL,
    ...(DATABASE_SCHEMA ? [`--schema=${DATABASE_SCHEMA}`] : []),
    "--format=custom",
    `--file=${file}`,
  ]);
  return file;
}

async function mirrorBucket(runTimestamp: string): Promise<number> {
  const objects = await listAllObjects(sourceBucket);
  for (const pathname of objects) {
    const { data, error } = await supabase.storage.from(sourceBucket).download(pathname);
    if (error) throw error;
    const { error: uploadError } = await supabase.storage
      .from(BACKUP_BUCKET)
      .upload(`${runTimestamp}/data/${pathname}`, data, { upsert: true });
    if (uploadError) throw uploadError;
  }
  return objects.length;
}

async function pruneOldBackups(): Promise<void> {
  const { data, error } = await supabase.storage.from(BACKUP_BUCKET).list("");
  if (error) throw error;
  const runs = (data ?? [])
    .filter((i) => i.id === null)
    .map((i) => i.name)
    .sort();
  const stale = runs.slice(0, Math.max(0, runs.length - RETAIN));
  for (const run of stale) {
    const files = await listAllObjects(BACKUP_BUCKET, run);
    if (files.length > 0) {
      const { error: removeError } = await supabase.storage.from(BACKUP_BUCKET).remove(files);
      if (removeError) throw removeError;
    }
  }
}

const runTimestamp = new Date().toISOString().replace(/[:.]/g, "-");
const runDir = mkdtempSync(path.join(tmpdir(), "backup-"));

const dumpFile = dumpDatabase(runDir);
const { error: dumpUploadError } = await supabase.storage
  .from(BACKUP_BUCKET)
  .upload(`${runTimestamp}/db.dump`, readFileSync(dumpFile), { upsert: true });
if (dumpUploadError) throw dumpUploadError;

const objectCount = await mirrorBucket(runTimestamp);
await pruneOldBackups();

console.log(
  `backup ${runTimestamp}: mirrored ${objectCount} object(s) from "${sourceBucket}" + db.dump`
);
