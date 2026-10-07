import { getDb, parseJson } from './index';
import { leadCounts, listLeads } from './leads';
import { listVisits, visitCounts } from './visits';
import { recentlyUpdatedLayouts } from './layouts';
import { plotStatusSummary } from './plots';
import type { AuditLog } from '../types';

export function dashboardStats() {
  const db = getDb();
  const layouts = (db.prepare('SELECT COUNT(*) AS n FROM layouts WHERE active = 1').get() as { n: number }).n;
  const plots = plotStatusSummary();
  const byStatus = Object.fromEntries(plots.map((p) => [p.status, p.count])) as Record<string, number>;
  const totalPlots = plots.reduce((s, p) => s + p.count, 0);
  const leads = leadCounts();
  const visits = visitCounts();

  return {
    cards: {
      totalLayouts: layouts,
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
    recentLeads: listLeads({ limit: 6 }),
    upcomingVisits: listVisits({ window: 'upcoming', limit: 6 }),
    recentLayouts: recentlyUpdatedLayouts(5),
    plotAvailability: plots,
  };
}

export type DashboardStats = ReturnType<typeof dashboardStats>;

export function listAuditLogs(limit = 100): AuditLog[] {
  const rows = getDb().prepare(`
    SELECT a.*, u.name AS user_name FROM audit_logs a LEFT JOIN users u ON u.id = a.user_id
    ORDER BY a.created_at DESC LIMIT ?
  `).all(limit) as Record<string, unknown>[];
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
