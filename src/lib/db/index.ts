import 'server-only';
import { createClient, type Client, type InValue } from '@libsql/client';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { SCHEMA_SQL, SCHEMA_VERSION } from './schema';
import { seedDatabase } from './seed';

export type Row = Record<string, unknown>;
export type Arg = InValue | undefined;

export const DATA_DIR = process.env.IMPERIUM_DATA_DIR ?? path.join(process.cwd(), 'data');

// Production points TURSO_DATABASE_URL at a hosted libSQL database; local dev falls back to a file.
function connectionUrl(): string {
  if (process.env.TURSO_DATABASE_URL) return process.env.TURSO_DATABASE_URL;
  // Hosts like Render wipe the local disk on every deploy, so a silent fallback would lose all data.
  if (process.env.NODE_ENV === 'production' && !process.env.IMPERIUM_DATA_DIR) {
    throw new Error('TURSO_DATABASE_URL is not set. Set it (and TURSO_AUTH_TOKEN), or set IMPERIUM_DATA_DIR to a persistent disk path.');
  }
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const file = path.relative(process.cwd(), path.join(DATA_DIR, 'imperium-realtors.sqlite')).replace(/\\/g, '/');
  return `file:${file}`;
}

declare global {
  // Cached across Next.js dev HMR reloads so we do not open a new connection per compile.
  var __imperiumRealtorsDb: Promise<Client> | undefined;
}

async function open(): Promise<Client> {
  const client = createClient({ url: connectionUrl(), authToken: process.env.TURSO_AUTH_TOKEN });
  await client.executeMultiple(SCHEMA_SQL);
  await client.execute({
    sql: "INSERT OR IGNORE INTO meta (key, value) VALUES ('schema_version', ?)",
    args: [String(SCHEMA_VERSION)],
  });
  await seedDatabase(client);
  return client;
}

export function getDb(): Promise<Client> {
  if (!globalThis.__imperiumRealtorsDb) {
    globalThis.__imperiumRealtorsDb = open().catch((err) => {
      globalThis.__imperiumRealtorsDb = undefined;
      throw err;
    });
  }
  return globalThis.__imperiumRealtorsDb;
}

const clean = (args: Arg[]): InValue[] => args.map((a) => (a === undefined ? null : a));

export async function all<T = Row>(sql: string, ...args: Arg[]): Promise<T[]> {
  const res = await (await getDb()).execute({ sql, args: clean(args) });
  return res.rows as unknown as T[];
}

export async function one<T = Row>(sql: string, ...args: Arg[]): Promise<T | undefined> {
  return (await all<T>(sql, ...args))[0];
}

/** Executes a write and returns the number of affected rows. */
export async function run(sql: string, ...args: Arg[]): Promise<number> {
  const res = await (await getDb()).execute({ sql, args: clean(args) });
  return res.rowsAffected;
}

/** Runs several writes atomically. */
export async function transaction(stmts: { sql: string; args?: Arg[] }[]): Promise<number[]> {
  const results = await (await getDb()).batch(
    stmts.map((s) => ({ sql: s.sql, args: clean(s.args ?? []) })),
    'write',
  );
  return results.map((r) => r.rowsAffected);
}

export const nowIso = () => new Date().toISOString();
export const newId = () => randomUUID();

export function parseJson<T>(raw: unknown, fallback: T): T {
  if (typeof raw !== 'string') return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
}

export const toBool = (v: unknown) => v === 1 || v === true || v === '1';
