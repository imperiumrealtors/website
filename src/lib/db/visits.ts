import { all, newId, nowIso, one, run, toBool, type Row } from './index';
import type { SiteVisit, VisitStatus } from '../types';

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

export async function listVisits(opts: {
  search?: string; status?: VisitStatus; assignedTo?: string; window?: 'upcoming' | 'past' | 'all'; limit?: number;
} = {}): Promise<SiteVisit[]> {
  const where: string[] = [];
  const params: string[] = [];
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
  return (await all(sql, ...params)).map(rowToVisit);
}

export async function getVisit(id: string): Promise<SiteVisit | null> {
  const row = await one(`${BASE} WHERE v.id = ?`, id);
  return row ? rowToVisit(row) : null;
}

export type VisitInput = Omit<SiteVisit, 'id' | 'createdAt' | 'updatedAt' | 'layoutName' | 'assignedName'>;

export async function createVisit(input: VisitInput): Promise<SiteVisit> {
  const id = newId();
  const ts = nowIso();
  await run(`
    INSERT INTO site_visits (id, lead_id, customer_name, phone, layout_id, preferred_date, preferred_time, visitors, pickup, assigned_to, status, notes, created_at, updated_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `, id, input.leadId, input.customerName, input.phone, input.layoutId, input.preferredDate, input.preferredTime,
    input.visitors, input.pickup ? 1 : 0, input.assignedTo, input.status, input.notes, ts, ts);
  return (await getVisit(id))!;
}

export async function updateVisit(id: string, input: Partial<VisitInput>): Promise<SiteVisit | null> {
  const current = await getVisit(id);
  if (!current) return null;
  const next = { ...current, ...input };
  await run(`
    UPDATE site_visits SET lead_id=?, customer_name=?, phone=?, layout_id=?, preferred_date=?, preferred_time=?, visitors=?, pickup=?, assigned_to=?, status=?, notes=?, updated_at=?
    WHERE id = ?
  `, next.leadId, next.customerName, next.phone, next.layoutId, next.preferredDate, next.preferredTime,
    next.visitors, next.pickup ? 1 : 0, next.assignedTo, next.status, next.notes, nowIso(), id);
  return getVisit(id);
}

export async function deleteVisit(id: string): Promise<boolean> {
  return (await run('DELETE FROM site_visits WHERE id = ?', id)) > 0;
}

export async function visitCounts(): Promise<{ upcoming: number; completed: number }> {
  const today = new Date().toISOString().slice(0, 10);
  const row = await one<{ upcoming: number; completed: number }>(`
    SELECT
      COALESCE(SUM(preferred_date >= ? AND status IN ('Requested','Confirmed','Rescheduled')), 0) AS upcoming,
      COALESCE(SUM(status = 'Completed'), 0) AS completed
    FROM site_visits
  `, today);
  return { upcoming: Number(row?.upcoming ?? 0), completed: Number(row?.completed ?? 0) };
}
