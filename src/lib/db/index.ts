import 'server-only';
import { DatabaseSync } from 'node:sqlite';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { SCHEMA_SQL, SCHEMA_VERSION } from './schema';
import { seedDatabase } from './seed';

export const DATA_DIR = process.env.IMPERIUM_DATA_DIR ?? path.join(process.cwd(), 'data');
export const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');
const DB_PATH = process.env.IMPERIUM_DATABASE_PATH ?? path.join(DATA_DIR, 'imperium-realtors.sqlite');

declare global {
  // Cached across Next.js dev HMR reloads so we do not open a new handle per compile.
  var __imperiumRealtorsDb: DatabaseSync | undefined;
}

function open(): DatabaseSync {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  const db = new DatabaseSync(DB_PATH);
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec('PRAGMA busy_timeout = 5000;');
  db.exec(SCHEMA_SQL);

  const version = db.prepare("SELECT value FROM meta WHERE key = 'schema_version'").get() as { value: string } | undefined;
  if (!version) {
    db.prepare("INSERT INTO meta (key, value) VALUES ('schema_version', ?)").run(String(SCHEMA_VERSION));
  }
  seedDatabase(db);
  return db;
}

export function getDb(): DatabaseSync {
  if (!globalThis.__imperiumRealtorsDb) globalThis.__imperiumRealtorsDb = open();
  return globalThis.__imperiumRealtorsDb;
}

export const nowIso = () => new Date().toISOString();
export const newId = () => randomUUID();

export function parseJson<T>(raw: unknown, fallback: T): T {
  if (typeof raw !== 'string') return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
}

export const toBool = (v: unknown) => v === 1 || v === true || v === '1';
