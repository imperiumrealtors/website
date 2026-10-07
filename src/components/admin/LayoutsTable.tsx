'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Pencil, Trash2, Eye, EyeOff, ExternalLink } from 'lucide-react';
import type { LayoutSummary } from '@/lib/db/layouts';
import { api, formatDate } from '@/lib/admin-api';
import { PageHeader, Card, StatusPill, EmptyState, ConfirmDialog, SearchInput, useToast } from './ui';

export default function LayoutsTable({ initial, canWrite }: { initial: LayoutSummary[]; canWrite: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [rows, setRows] = useState(initial);
  const [q, setQ] = useState('');
  const [pendingDelete, setPendingDelete] = useState<LayoutSummary | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s ? rows.filter((r) => `${r.name} ${r.location} ${r.corridor} ${r.status}`.toLowerCase().includes(s)) : rows;
  }, [rows, q]);

  const toggleActive = async (layout: LayoutSummary) => {
    setBusy(layout.id);
    const res = await api.patch<LayoutSummary>(`/api/admin/layouts/${layout.id}`, { active: !layout.active });
    setBusy(null);
    if (!res.ok) { toast('error', res.error); return; }
    setRows((r) => r.map((x) => (x.id === layout.id ? res.data : x)));
    toast('success', `${layout.name} is now ${res.data.active ? 'live on the website' : 'hidden from the website'}.`);
    router.refresh();
  };

  const remove = async () => {
    if (!pendingDelete) return;
    setBusy(pendingDelete.id);
    const res = await api.del(`/api/admin/layouts/${pendingDelete.id}`);
    setBusy(null);
    if (!res.ok) { toast('error', res.error); return; }
    setRows((r) => r.filter((x) => x.id !== pendingDelete.id));
    toast('success', `${pendingDelete.name} deleted.`);
    setPendingDelete(null);
    router.refresh();
  };

  return (
    <>
      <PageHeader
        title="Layouts"
        subtitle={`${rows.length} layout${rows.length === 1 ? '' : 's'} · ${rows.filter((r) => r.active).length} live on the website`}
        actions={canWrite && <Link href="/admin/layouts/new" className="btn btn-primary btn-sm"><Plus size={15} /> New layout</Link>}
      />

      <Card padded={false} actions={<SearchInput value={q} onChange={setQ} placeholder="Search layouts…" />} title="All layouts">
        {filtered.length === 0 ? (
          <EmptyState
            title={rows.length === 0 ? 'No layouts yet' : 'No layouts match your search'}
            body={rows.length === 0 ? 'Create your first layout to start listing plots on the website.' : 'Try a different name, locality or corridor.'}
            action={canWrite && rows.length === 0 && <Link href="/admin/layouts/new" className="btn btn-primary btn-sm">Create layout</Link>}
          />
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Layout</th><th>Corridor</th><th>Status</th><th>Plots</th><th>Starting</th><th>Rate</th><th>Updated</th><th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((l) => (
                  <tr key={l.id} style={{ opacity: l.active ? 1 : 0.6 }}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--brand-deep)' }}>{l.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{l.location}</div>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>{l.corridor.split('—')[0].trim()}</td>
                    <td><div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}><StatusPill value={l.status} />{!l.active && <StatusPill value="inactive" />}</div></td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <span style={{ fontWeight: 600, color: l.availablePlots < 10 ? 'var(--status-hold)' : 'var(--status-available)' }}>{l.availablePlots}</span>
                      <span style={{ color: 'var(--text-muted)' }}> / {l.totalPlots}</span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{l.priceLabel}</td>
                    <td>₹{l.pricePerSqft.toLocaleString('en-IN')}</td>
                    <td style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{formatDate(l.updatedAt)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <Link href={`/plots/${l.slug}`} target="_blank" className="admin-icon-btn" title="View on website"><ExternalLink size={14} /></Link>
                        {canWrite && (
                          <>
                            <Link href={`/admin/layouts/${l.id}/edit`} className="admin-icon-btn" title="Edit"><Pencil size={14} /></Link>
                            <button className="admin-icon-btn" title={l.active ? 'Hide from website' : 'Publish to website'} onClick={() => toggleActive(l)} disabled={busy === l.id}>
                              {l.active ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                            <button className="admin-icon-btn danger" title="Delete" onClick={() => setPendingDelete(l)} disabled={busy === l.id}><Trash2 size={14} /></button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {pendingDelete && (
        <ConfirmDialog
          title={`Delete ${pendingDelete.name}?`}
          body={`This permanently removes the layout and all ${pendingDelete.totalPlots} plots in it. Leads linked to it are kept but unlinked. If you only want to take it off the website, hide it instead.`}
          busy={busy === pendingDelete.id}
          onConfirm={remove}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </>
  );
}
