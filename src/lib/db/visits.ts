import { getDb, newId, nowIso, toBool } from './index';
import type { SiteVisit, VisitStatus } from '../types';

type Row = Record<string, unknown>;

function rowToVisit(r: Row): SiteVisit {
  return {
    id: r.id as string,
    leadId: (r.lead_id as string | null) ?? null,
    customerName: r.customer_name as string,
    phone: r.phone as string,
    layoutId: (r.layout_id as string | null) ?? null,
    layoutName: (r.layout_name as string | null) ?? null,
    preferredDate: r.preferred_date as string,
    preferredTime: r.preferred_time as string,
    visitors: Number(r.visitors),
    pickup: toBool(r.pickup),
    assignedTo: (r.assigned_to as string | null) ?? null,
    assignedName: (r.assigned_name as string | null) ?? null,
    status: r.status as VisitStatus,
    notes: r.notes as string,
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  };
}

const BASE = `
  SELECT v.*, l.name AS layout_name, u.name AS assigned_name
  FROM site_visits v
  LEFT JOIN layouts l ON l.id = v.layout_id
  LEFT JOIN users u ON u.id = v.assigned_to
`;

export function listVisits(opts: {
  search?: string; status?: VisitStatus; assignedTo?: string; window?: 'upcoming' | 'past' | 'all'; limit?: number;
} = {}): SiteVisit[] {
  const where: string[] = [];
  const params: unknown[] = [];
  const today = new Date().toISOString().slice(0, 10);
  if (opts.search) {
    where.push('(v.customer_name LIKE ? OR v.phone LIKE ? OR l.name LIKE ?)');
    const q = `%${opts.search}%`;
    params.push(q, q, q);
  }
  if (opts.status) { where.push('v.status = ?'); params.push(opts.status); }
  if (opts.assignedTo) { where.push('v.assigned_to = ?'); params.push(opts.assignedTo); }
  if (opts.window === 'upcoming') { where.push("v.preferred_date >= ? AND v.status IN ('Requested','Confirmed','Rescheduled')"); params.push(today); }
  if (opts.window === 'past') { where.push("(v.preferred_date < ? OR v.status IN ('Completed','Cancelled'))"); params.push(today); }
  const order = opts.window === 'past' ? 'v.preferred_date DESC' : 'v.preferred_date ASC, v.preferred_time ASC';
  const sql = `${BASE} ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY ${order} ${opts.limit ? `LIMIT ${Number(opts.limit)}` : ''}`;
  return (getDb().prepare(sql).all(...(params as string[])) as Row[]).map(rowToVisit);
}

export function getVisit(id: string): SiteVisit | null {
  const row = getDb().prepare(`${BASE} WHERE v.id = ?`).get(id) as Row | undefined;
  return row ? rowToVisit(row) : null;
}

export type VisitInput = Omit<SiteVisit, 'id' | 'createdAt' | 'updatedAt' | 'layoutName' | 'assignedName'>;

export function createVisit(input: VisitInput): SiteVisit {
  const id = newId();
  const ts = nowIso();
  getDb().prepare(`
    INSERT INTO site_visits (id, lead_id, customer_name, phone, layout_id, preferred_date, preferred_time, visitors, pickup, assigned_to, status, notes, created_at, updated_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(id, input.leadId, input.customerName, input.phone, input.layoutId, input.preferredDate, input.preferredTime,
    input.visitors, input.pickup ? 1 : 0, input.assignedTo, input.status, input.notes, ts, ts);
  return getVisit(id)!;
}

export function updateVisit(id: string, input: Partial<VisitInput>): SiteVisit | null {
  const current = getVisit(id);
  if (!current) return null;
  const next = { ...current, ...input };
  getDb().prepare(`
    UPDATE site_visits SET lead_id=?, customer_name=?, phone=?, layout_id=?, preferred_date=?, preferred_time=?, visitors=?, pickup=?, assigned_to=?, status=?, notes=?, updated_at=?
    WHERE id = ?
  `).run(next.leadId, next.customerName, next.phone, next.layoutId, next.preferredDate, next.preferredTime,
    next.visitors, next.pickup ? 1 : 0, next.assignedTo, next.status, next.notes, nowIso(), id);
  return getVisit(id);
}

export function deleteVisit(id: string): boolean {
  return getDb().prepare('DELETE FROM site_visits WHERE id = ?').run(id).changes > 0;
}

export function visitCounts(): { upcoming: number; completed: number } {
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = (getDb().prepare("SELECT COUNT(*) AS n FROM site_visits WHERE preferred_date >= ? AND status IN ('Requested','Confirmed','Rescheduled')").get(today) as { n: number }).n;
  const completed = (getDb().prepare("SELECT COUNT(*) AS n FROM site_visits WHERE status = 'Completed'").get() as { n: number }).n;
  return { upcoming, completed };
}
