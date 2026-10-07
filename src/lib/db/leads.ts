import { getDb, newId, nowIso } from './index';
import type { Lead, LeadStatus } from '../types';

type Row = Record<string, unknown>;

function rowToLead(r: Row): Lead {
  return {
    id: r.id as string,
    name: r.name as string,
    phone: r.phone as string,
    email: r.email as string,
    layoutId: (r.layout_id as string | null) ?? null,
    layoutName: (r.layout_name as string | null) ?? null,
    plotId: (r.plot_id as string | null) ?? null,
    plotNumber: (r.plot_number as string | null) ?? null,
    budget: r.budget as string,
    source: r.source as string,
    status: r.status as LeadStatus,
    assignedTo: (r.assigned_to as string | null) ?? null,
    assignedName: (r.assigned_name as string | null) ?? null,
    notes: r.notes as string,
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  };
}

const BASE = `
  SELECT ld.*, l.name AS layout_name, p.number AS plot_number, u.name AS assigned_name
  FROM leads ld
  LEFT JOIN layouts l ON l.id = ld.layout_id
  LEFT JOIN plots p ON p.id = ld.plot_id
  LEFT JOIN users u ON u.id = ld.assigned_to
`;

export type LeadSort = 'newest' | 'oldest' | 'name' | 'status';

export function listLeads(opts: {
  search?: string; status?: LeadStatus; assignedTo?: string; layoutId?: string; sort?: LeadSort; limit?: number;
} = {}): Lead[] {
  const where: string[] = [];
  const params: unknown[] = [];
  if (opts.search) {
    where.push('(ld.name LIKE ? OR ld.phone LIKE ? OR ld.email LIKE ? OR l.name LIKE ?)');
    const q = `%${opts.search}%`;
    params.push(q, q, q, q);
  }
  if (opts.status) { where.push('ld.status = ?'); params.push(opts.status); }
  if (opts.assignedTo) { where.push('ld.assigned_to = ?'); params.push(opts.assignedTo); }
  if (opts.layoutId) { where.push('ld.layout_id = ?'); params.push(opts.layoutId); }
  const order = {
    newest: 'ld.created_at DESC',
    oldest: 'ld.created_at ASC',
    name: 'ld.name COLLATE NOCASE ASC',
    status: 'ld.status ASC, ld.created_at DESC',
  }[opts.sort ?? 'newest'];
  const sql = `${BASE} ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY ${order} ${opts.limit ? `LIMIT ${Number(opts.limit)}` : ''}`;
  return (getDb().prepare(sql).all(...(params as string[])) as Row[]).map(rowToLead);
}

export function getLead(id: string): Lead | null {
  const row = getDb().prepare(`${BASE} WHERE ld.id = ?`).get(id) as Row | undefined;
  return row ? rowToLead(row) : null;
}

export type LeadInput = Omit<Lead, 'id' | 'createdAt' | 'updatedAt' | 'layoutName' | 'plotNumber' | 'assignedName'>;

export function createLead(input: LeadInput): Lead {
  const id = newId();
  const ts = nowIso();
  getDb().prepare(`
    INSERT INTO leads (id, name, phone, email, layout_id, plot_id, budget, source, status, assigned_to, notes, created_at, updated_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(id, input.name, input.phone, input.email, input.layoutId, input.plotId, input.budget, input.source,
    input.status, input.assignedTo, input.notes, ts, ts);
  return getLead(id)!;
}

export function updateLead(id: string, input: Partial<LeadInput>): Lead | null {
  const current = getLead(id);
  if (!current) return null;
  const next = { ...current, ...input };
  getDb().prepare(`
    UPDATE leads SET name=?, phone=?, email=?, layout_id=?, plot_id=?, budget=?, source=?, status=?, assigned_to=?, notes=?, updated_at=?
    WHERE id = ?
  `).run(next.name, next.phone, next.email, next.layoutId, next.plotId, next.budget, next.source, next.status,
    next.assignedTo, next.notes, nowIso(), id);
  return getLead(id);
}

export function deleteLead(id: string): boolean {
  return getDb().prepare('DELETE FROM leads WHERE id = ?').run(id).changes > 0;
}

export function leadCounts(): { total: number; fresh: number } {
  const total = (getDb().prepare('SELECT COUNT(*) AS n FROM leads').get() as { n: number }).n;
  const fresh = (getDb().prepare("SELECT COUNT(*) AS n FROM leads WHERE status = 'New'").get() as { n: number }).n;
  return { total, fresh };
}
