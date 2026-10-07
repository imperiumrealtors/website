import { getDb, newId, nowIso } from './index';
import { hashPassword } from '../auth/password';
import type { Role, User } from '../types';

type Row = Record<string, unknown>;

function rowToUser(r: Row): User {
  return {
    id: r.id as string,
    name: r.name as string,
    email: r.email as string,
    role: r.role as Role,
    status: r.status as User['status'],
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
    lastLoginAt: (r.last_login_at as string | null) ?? null,
  };
}

const SAFE_COLS = 'id, name, email, role, status, created_at, updated_at, last_login_at';

export function listUsers(opts: { search?: string; role?: Role; portalOnly?: boolean } = {}): User[] {
  const where: string[] = [];
  const params: unknown[] = [];
  if (opts.search) { where.push('(name LIKE ? OR email LIKE ?)'); params.push(`%${opts.search}%`, `%${opts.search}%`); }
  if (opts.role) { where.push('role = ?'); params.push(opts.role); }
  if (opts.portalOnly) where.push("role IN ('admin','manager','sales')");
  const sql = `SELECT ${SAFE_COLS} FROM users ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY created_at ASC`;
  return (getDb().prepare(sql).all(...(params as string[])) as Row[]).map(rowToUser);
}

export function getUser(id: string): User | null {
  const row = getDb().prepare(`SELECT ${SAFE_COLS} FROM users WHERE id = ?`).get(id) as Row | undefined;
  return row ? rowToUser(row) : null;
}

export function getUserWithHashByEmail(email: string): (User & { passwordHash: string }) | null {
  const row = getDb().prepare('SELECT * FROM users WHERE email = ?').get(email) as Row | undefined;
  return row ? { ...rowToUser(row), passwordHash: row.password_hash as string } : null;
}

export function getPasswordHash(id: string): string | null {
  const row = getDb().prepare('SELECT password_hash FROM users WHERE id = ?').get(id) as Row | undefined;
  return row ? (row.password_hash as string) : null;
}

export function emailExists(email: string, exceptId?: string): boolean {
  return Boolean(getDb().prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(email, exceptId ?? ''));
}

export function createUser(input: { name: string; email: string; password: string; role: Role; status: User['status'] }): User {
  const id = newId();
  const ts = nowIso();
  getDb().prepare(`
    INSERT INTO users (id, name, email, password_hash, role, status, created_at, updated_at)
    VALUES (?,?,?,?,?,?,?,?)
  `).run(id, input.name, input.email, hashPassword(input.password), input.role, input.status, ts, ts);
  return getUser(id)!;
}

export function updateUser(id: string, input: { name: string; email: string; role: Role; status: User['status'] }): User | null {
  const res = getDb().prepare('UPDATE users SET name=?, email=?, role=?, status=?, updated_at=? WHERE id=?')
    .run(input.name, input.email, input.role, input.status, nowIso(), id);
  return res.changes ? getUser(id) : null;
}

export function setUserPassword(id: string, password: string) {
  getDb().prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?').run(hashPassword(password), nowIso(), id);
}

export function touchLastLogin(id: string) {
  getDb().prepare('UPDATE users SET last_login_at = ? WHERE id = ?').run(nowIso(), id);
}

export function countActiveAdmins(exceptId?: string): number {
  return (getDb().prepare("SELECT COUNT(*) AS n FROM users WHERE role = 'admin' AND status = 'active' AND id != ?").get(exceptId ?? '') as { n: number }).n;
}
