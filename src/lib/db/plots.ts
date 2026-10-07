import { getDb, newId, nowIso, toBool } from './index';
import type { Facing, PlotRecord, PlotStatus } from '../types';

type Row = Record<string, unknown>;

function rowToPlot(r: Row): PlotRecord {
  return {
    id: r.id as string,
    layoutId: r.layout_id as string,
    layoutName: (r.layout_name as string | undefined) ?? undefined,
    number: r.number as string,
    area: Number(r.area),
    dimensions: r.dimensions as string,
    facing: r.facing as Facing,
    corner: toBool(r.corner),
    priceLakhs: Number(r.price_lakhs),
    priceLabel: r.price_label as string,
    status: r.status as PlotStatus,
    notes: r.notes as string,
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  };
}

const BASE = 'SELECT p.*, l.name AS layout_name FROM plots p JOIN layouts l ON l.id = p.layout_id';

export function listPlots(opts: { layoutId?: string; status?: PlotStatus; search?: string; limit?: number } = {}): PlotRecord[] {
  const where: string[] = [];
  const params: unknown[] = [];
  if (opts.layoutId) { where.push('p.layout_id = ?'); params.push(opts.layoutId); }
  if (opts.status) { where.push('p.status = ?'); params.push(opts.status); }
  if (opts.search) { where.push('(p.number LIKE ? OR l.name LIKE ?)'); params.push(`%${opts.search}%`, `%${opts.search}%`); }
  const sql = `${BASE} ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY l.name, p.number ${opts.limit ? `LIMIT ${Number(opts.limit)}` : ''}`;
  return (getDb().prepare(sql).all(...(params as string[])) as Row[]).map(rowToPlot);
}

/** Plots for a public listing: representative sample first (named units), sorted for display. */
export function listPlotsForLayout(layoutId: string): PlotRecord[] {
  return (getDb().prepare(`${BASE} WHERE p.layout_id = ? ORDER BY p.number`).all(layoutId) as Row[]).map(rowToPlot);
}

export function getPlot(id: string): PlotRecord | null {
  const row = getDb().prepare(`${BASE} WHERE p.id = ?`).get(id) as Row | undefined;
  return row ? rowToPlot(row) : null;
}

export type PlotInput = Omit<PlotRecord, 'id' | 'createdAt' | 'updatedAt' | 'layoutName'>;

export function plotNumberExists(layoutId: string, number: string, exceptId?: string): boolean {
  return Boolean(getDb().prepare('SELECT id FROM plots WHERE layout_id = ? AND number = ? AND id != ?').get(layoutId, number, exceptId ?? ''));
}

export function createPlot(input: PlotInput): PlotRecord {
  const id = newId();
  const ts = nowIso();
  getDb().prepare(`
    INSERT INTO plots (id, layout_id, number, area, dimensions, facing, corner, price_lakhs, price_label, status, notes, created_at, updated_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(id, input.layoutId, input.number, input.area, input.dimensions, input.facing, input.corner ? 1 : 0,
    input.priceLakhs, input.priceLabel, input.status, input.notes, ts, ts);
  return getPlot(id)!;
}

export function updatePlot(id: string, input: Partial<PlotInput>): PlotRecord | null {
  const current = getPlot(id);
  if (!current) return null;
  const next = { ...current, ...input };
  getDb().prepare(`
    UPDATE plots SET layout_id=?, number=?, area=?, dimensions=?, facing=?, corner=?, price_lakhs=?, price_label=?, status=?, notes=?, updated_at=?
    WHERE id = ?
  `).run(next.layoutId, next.number, next.area, next.dimensions, next.facing, next.corner ? 1 : 0,
    next.priceLakhs, next.priceLabel, next.status, next.notes, nowIso(), id);
  return getPlot(id);
}

export function deletePlot(id: string): boolean {
  return getDb().prepare('DELETE FROM plots WHERE id = ?').run(id).changes > 0;
}

export function plotStatusSummary(): { status: PlotStatus; count: number }[] {
  return getDb().prepare('SELECT status, COUNT(*) AS count FROM plots GROUP BY status').all() as { status: PlotStatus; count: number }[];
}
