import { all, one, parseJson } from './index';
import { leadCounts, listLeads } from './leads';
import { listVisits, visitCounts } from './visits';
import { recentlyUpdatedLayouts } from './layouts';
import { plotStatusSummary } from './plots';
import type { AuditLog } from '../types';

export async function dashboardStats() {
  const [layoutsRow, plots, leads, visits, recentLeads, upcomingVisits, recentLayouts] = await Promise.all([
    one<{ n: number }>('SELECT COUNT(*) AS n FROM layouts WHERE active = 1'),
    plotStatusSummary(),
    leadCounts(),
    visitCounts(),
    listLeads({ limit: 6 }),
    listVisits({ window: 'upcoming', limit: 6 }),
    recentlyUpdatedLayouts(5),
  ]);
  const byStatus = Object.fromEntries(plots.map((p) => [p.status, p.count])) as Record<string, number>;
  const totalPlots = plots.reduce((s, p) => s + p.count, 0);

  return {
    cards: {
      totalLayouts: Number(layoutsRow?.n ?? 0),
      totalPlots,
      availablePlots: byStatus.Available ?? 0,
      soldPlots: byStatus.Sold ?? 0,
      reservedPlots: byStatus.Reserved ?? 0,
      blockedPlots: byStatus.Blocked ?? 0,
      totalLeads: leads.total,
      newLeads: leads.fresh,
      upcomingVisits: visits.upcoming,
      completedVisits: visits.completed,
    },
    recentLeads,
    upcomingVisits,
    recentLayouts,
    plotAvailability: plots,
  };
}

export type DashboardStats = Awaited<ReturnType<typeof dashboardStats>>;

export async function listAuditLogs(limit = 100): Promise<AuditLog[]> {
  const rows = await all(`
    SELECT a.*, u.name AS user_name FROM audit_logs a LEFT JOIN users u ON u.id = a.user_id
    ORDER BY a.created_at DESC LIMIT ?
  `, limit);
  return rows.map((r) => ({
    id: r.id as string,
    userId: (r.user_id as string | null) ?? null,
    userName: (r.user_name as string | null) ?? null,
    action: r.action as string,
    entity: r.entity as string,
    entityId: (r.entity_id as string | null) ?? null,
    details: parseJson<Record<string, unknown>>(r.details, {}),
    ip: (r.ip as string | null) ?? null,
    createdAt: r.created_at as string,
  }));
}
