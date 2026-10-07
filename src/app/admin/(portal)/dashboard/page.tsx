import Link from 'next/link';
import { Map, LandPlot, CheckCircle2, Tag, Users, Sparkles, CalendarCheck, CalendarDays } from 'lucide-react';
import { requirePagePermission } from '@/lib/auth/guard';
import { can } from '@/lib/auth/permissions';
import { dashboardStats } from '@/lib/db/stats';
import { formatDate } from '@/lib/format';
import { PageHeader, Card, StatCard, StatusPill, EmptyState } from '@/components/admin/ui';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const user = await requirePagePermission('dashboard:view');
  const stats = dashboardStats();
  const c = stats.cards;
  const totalForBar = Math.max(1, c.totalPlots);

  return (
    <>
      <PageHeader
        title={`Good ${greeting()}, ${user.name.split(' ')[0]}`}
        subtitle={`${c.availablePlots} of ${c.totalPlots} plots are open across ${c.totalLayouts} active layouts.`}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 14 }}>
        <StatCard label="Total layouts" value={c.totalLayouts} icon={<Map size={18} />} />
        <StatCard label="Total plots" value={c.totalPlots} icon={<LandPlot size={18} />} accent="var(--brand-deep)" />
        <StatCard label="Available plots" value={c.availablePlots} icon={<CheckCircle2 size={18} />} accent="var(--status-available)" />
        <StatCard label="Sold plots" value={c.soldPlots} icon={<Tag size={18} />} accent="var(--status-sold)" />
        <StatCard label="Total leads" value={c.totalLeads} icon={<Users size={18} />} accent="#1D4ED8" />
        <StatCard label="New leads" value={c.newLeads} icon={<Sparkles size={18} />} accent="#1D4ED8" />
        <StatCard label="Upcoming site visits" value={c.upcomingVisits} icon={<CalendarDays size={18} />} accent="var(--status-hold)" />
        <StatCard label="Completed site visits" value={c.completedVisits} icon={<CalendarCheck size={18} />} accent="var(--brand-deep)" />
      </div>

      <div className="admin-grid-2">
        <Card title="Recent leads" actions={can(user.role, 'leads:read') && <Link href="/admin/leads" className="btn btn-secondary btn-sm">View all</Link>} padded={false}>
          {stats.recentLeads.length === 0 ? <EmptyState title="No leads yet" body="Enquiries from the website will appear here." /> : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead><tr><th>Lead</th><th>Layout</th><th>Status</th><th>Received</th></tr></thead>
                <tbody>
                  {stats.recentLeads.map((l) => (
                    <tr key={l.id}>
                      <td><div style={{ fontWeight: 600, color: 'var(--brand-deep)' }}>{l.name}</div><div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{l.phone}</div></td>
                      <td>{l.layoutName ?? <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                      <td><StatusPill value={l.status} /></td>
                      <td style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{formatDate(l.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card title="Upcoming site visits" actions={can(user.role, 'visits:read') && <Link href="/admin/site-visits" className="btn btn-secondary btn-sm">View all</Link>} padded={false}>
          {stats.upcomingVisits.length === 0 ? <EmptyState title="No upcoming visits" body="Confirmed and requested visits from today onwards show here." /> : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead><tr><th>Customer</th><th>Layout</th><th>When</th><th>Status</th></tr></thead>
                <tbody>
                  {stats.upcomingVisits.map((v) => (
                    <tr key={v.id}>
                      <td><div style={{ fontWeight: 600, color: 'var(--brand-deep)' }}>{v.customerName}</div><div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{v.phone}</div></td>
                      <td>{v.layoutName ?? '—'}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>{formatDate(v.preferredDate)} · {v.preferredTime}</td>
                      <td><StatusPill value={v.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card title="Recent layout updates" actions={can(user.role, 'layouts:read') && <Link href="/admin/layouts" className="btn btn-secondary btn-sm">Manage</Link>} padded={false}>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Layout</th><th>Status</th><th>Availability</th><th>Updated</th></tr></thead>
              <tbody>
                {stats.recentLayouts.map((l) => (
                  <tr key={l.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--brand-deep)' }}>{l.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{l.location}</div>
                    </td>
                    <td><StatusPill value={l.active ? l.status : 'inactive'} /></td>
                    <td style={{ whiteSpace: 'nowrap' }}>{l.availablePlots} / {l.totalPlots}</td>
                    <td style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{formatDate(l.updatedAt, true)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="Plot availability">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {(['Available', 'Reserved', 'Sold', 'Blocked'] as const).map((status) => {
              const count = stats.plotAvailability.find((p) => p.status === status)?.count ?? 0;
              const colour = { Available: 'var(--status-available)', Reserved: 'var(--status-hold)', Sold: 'var(--status-sold)', Blocked: 'var(--brand-deep)' }[status];
              return (
                <div key={status}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, marginBottom: 6 }}>
                    <span style={{ fontWeight: 600, color: 'var(--brand-deep)' }}>{status}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{count} · {Math.round((count / totalForBar) * 100)}%</span>
                  </div>
                  <div style={{ height: 8, background: 'var(--surface-raised)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ width: `${(count / totalForBar) * 100}%`, height: '100%', background: colour, transition: 'width var(--transition-slow)' }} />
                  </div>
                </div>
              );
            })}
            {can(user.role, 'plots:read') && (
              <Link href="/admin/plots" className="btn btn-dark btn-sm" style={{ alignSelf: 'flex-start', marginTop: 6 }}>Update plot availability</Link>
            )}
          </div>
        </Card>
      </div>
    </>
  );
}

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
}
