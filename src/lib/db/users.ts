import { all, newId, nowIso, one, run, type Row } from './index';
import { hashPassword } from '../auth/password';
import type { Role, User } from '../types';

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

export async function listUsers(opts: { search?: string; role?: Role; portalOnly?: boolean } = {}): Promise<User[]> {
  const where: string[] = [];
  const params: string[] = [];
  if (opts.search) { where.push('(name LIKE ? OR email LIKE ?)'); params.push(`%${opts.search}%`, `%${opts.search}%`); }
  if (opts.role) { where.push('role = ?'); params.push(opts.role); }
  if (opts.portalOnly) where.push("role IN ('admin','manager','sales')");
  const sql = `SELECT ${SAFE_COLS} FROM users ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY created_at ASC`;
  return (await all(sql, ...params)).map(rowToUser);
}

export async function getUser(id: string): Promise<User | null> {
  const row = await one(`SELECT ${SAFE_COLS} FROM users WHERE id = ?`, id);
  return row ? rowToUser(row) : null;
}

export async function getUserWithHashByEmail(email: string): Promise<(User & { passwordHash: string }) | null> {
  const row = await one('SELECT * FROM users WHERE email = ?', email);
  return row ? { ...rowToUser(row), passwordHash: row.password_hash as string } : null;
}

export async function getPasswordHash(id: string): Promise<string | null> {
  const row = await one('SELECT password_hash FROM users WHERE id = ?', id);
  return row ? (row.password_hash as string) : null;
}

export async function emailExists(email: string, exceptId?: string): Promise<boolean> {
  return Boolean(await one('SELECT id FROM users WHERE email = ? AND id != ?', email, exceptId ?? ''));
}

export async function createUser(input: { name: string; email: string; password: string; role: Role; status: User['status'] }): Promise<User> {
  const id = newId();
  const ts = nowIso();
  await run(`
    INSERT INTO users (id, name, email, password_hash, role, status, created_at, updated_at)
    VALUES (?,?,?,?,?,?,?,?)
  `, id, input.name, input.email, hashPassword(input.password), input.role, input.status, ts, ts);
  return (await getUser(id))!;
}

export async function updateUser(id: string, input: { name: string; email: string; role: Role; status: User['status'] }): Promise<User | null> {
  const changes = await run('UPDATE users SET name=?, email=?, role=?, status=?, updated_at=? WHERE id=?',
    input.name, input.email, input.role, input.status, nowIso(), id);
  return changes ? getUser(id) : null;
}

export async function setUserPassword(id: string, password: string) {
  await run('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?', hashPassword(password), nowIso(), id);
}

export async function touchLastLogin(id: string) {
  await run('UPDATE users SET last_login_at = ? WHERE id = ?', nowIso(), id);
}

export async function countActiveAdmins(exceptId?: string): Promise<number> {
  const row = await one<{ n: number }>("SELECT COUNT(*) AS n FROM users WHERE role = 'admin' AND status = 'active' AND id != ?", exceptId ?? '');
  return Number(row?.n ?? 0);
}
