import { all, newId, nowIso, one, run, toBool, transaction, type Row } from './index';
import type { Facing, PlotRecord, PlotStatus } from '../types';

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

export async function listPlots(opts: { layoutId?: string; status?: PlotStatus; search?: string; limit?: number } = {}): Promise<PlotRecord[]> {
  const where: string[] = [];
  const params: string[] = [];
  if (opts.layoutId) { where.push('p.layout_id = ?'); params.push(opts.layoutId); }
  if (opts.status) { where.push('p.status = ?'); params.push(opts.status); }
  if (opts.search) { where.push('(p.number LIKE ? OR l.name LIKE ?)'); params.push(`%${opts.search}%`, `%${opts.search}%`); }
  const sql = `${BASE} ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY l.name, p.number ${opts.limit ? `LIMIT ${Number(opts.limit)}` : ''}`;
  return (await all(sql, ...params)).map(rowToPlot);
}

/** Plots for a public listing: representative sample first (named units), sorted for display. */
export async function listPlotsForLayout(layoutId: string): Promise<PlotRecord[]> {
  return (await all(`${BASE} WHERE p.layout_id = ? ORDER BY p.number`, layoutId)).map(rowToPlot);
}

/** All plots for several layouts in one query, grouped by layout id. */
export async function listPlotsForLayouts(layoutIds: string[]): Promise<Map<string, PlotRecord[]>> {
  const grouped = new Map<string, PlotRecord[]>(layoutIds.map((id) => [id, []]));
  if (!layoutIds.length) return grouped;
  const rows = await all(`${BASE} WHERE p.layout_id IN (${layoutIds.map(() => '?').join(',')}) ORDER BY p.number`, ...layoutIds);
  for (const r of rows) grouped.get(r.layout_id as string)?.push(rowToPlot(r));
  return grouped;
}

export async function getPlot(id: string): Promise<PlotRecord | null> {
  const row = await one(`${BASE} WHERE p.id = ?`, id);
  return row ? rowToPlot(row) : null;
}

export type PlotInput = Omit<PlotRecord, 'id' | 'createdAt' | 'updatedAt' | 'layoutName'>;

export async function plotNumberExists(layoutId: string, number: string, exceptId?: string): Promise<boolean> {
  return Boolean(await one('SELECT id FROM plots WHERE layout_id = ? AND number = ? AND id != ?', layoutId, number, exceptId ?? ''));
}

export async function createPlot(input: PlotInput): Promise<PlotRecord> {
  const id = newId();
  const ts = nowIso();
  await run(`
    INSERT INTO plots (id, layout_id, number, area, dimensions, facing, corner, price_lakhs, price_label, status, notes, created_at, updated_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
  `, id, input.layoutId, input.number, input.area, input.dimensions, input.facing, input.corner ? 1 : 0,
    input.priceLakhs, input.priceLabel, input.status, input.notes, ts, ts);
  return (await getPlot(id))!;
}

export async function updatePlot(id: string, input: Partial<PlotInput>): Promise<PlotRecord | null> {
  const current = await getPlot(id);
  if (!current) return null;
  const next = { ...current, ...input };
  await run(`
    UPDATE plots SET layout_id=?, number=?, area=?, dimensions=?, facing=?, corner=?, price_lakhs=?, price_label=?, status=?, notes=?, updated_at=?
    WHERE id = ?
  `, next.layoutId, next.number, next.area, next.dimensions, next.facing, next.corner ? 1 : 0,
    next.priceLakhs, next.priceLabel, next.status, next.notes, nowIso(), id);
  return getPlot(id);
}

export async function deletePlot(id: string): Promise<boolean> {
  const [, deleted] = await transaction([
    { sql: 'UPDATE leads SET plot_id = NULL WHERE plot_id = ?', args: [id] },
    { sql: 'DELETE FROM plots WHERE id = ?', args: [id] },
  ]);
  return deleted > 0;
}

export async function plotStatusSummary(): Promise<{ status: PlotStatus; count: number }[]> {
  const rows = await all<{ status: PlotStatus; count: number }>('SELECT status, COUNT(*) AS count FROM plots GROUP BY status');
  return rows.map((r) => ({ status: r.status, count: Number(r.count) }));
}
